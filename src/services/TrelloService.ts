import axios, { type AxiosRequestHeaders } from 'axios';

import { downloadFile } from '@/server/helpers/file';
import { logger } from '@/server/helpers/logger';

import { ServiceError } from './errors';

export type TrelloCard = {
  id: string;
  name: string;
  desc: string;
  url: string;
  due: string | null;
  dateLastActivity: string;
  labels: TrelloLabel[];
  attachments: {
    id: string;
    name: string;
    url: string;
    fileName: string;
  }[];
};

export type TrelloLabel = {
  id: string;
  name: string;
  color: string;
};

export type TrelloList = {
  id: string;
  name: string;
  closed: boolean;
};

export type TrelloBoard = {
  id: string;
  name: string;
  lists: TrelloList[];
};

export class TrelloService {
  private apiKey: string;
  private token: string;
  private boardId: string;

  constructor(apiKey: string, token: string, boardId: string) {
    this.apiKey = apiKey;
    this.token = token;
    this.boardId = boardId;
  }

  getAuthParams(): string {
    return `key=${this.apiKey}&token=${this.token}`;
  }

  private async getUrl<T>(path: string, queryParams: Record<string, string> = {}): Promise<T> {
    const url = `https://api.trello.com/1${path}?${this.getAuthParams()}&${new URLSearchParams(queryParams).toString()}`;
    logger.debug(`GET ${url}`);
    const { data } = await axios.get<T>(url);
    return data;
  }

  private async putUrl<T>(path: string, queryParams: Record<string, string> = {}): Promise<T> {
    const url = `https://api.trello.com/1${path}?${this.getAuthParams()}&${new URLSearchParams(queryParams).toString()}`;
    logger.debug(`PUT ${url}`);
    const { data } = await axios.put<T>(url);
    return data;
  }

  /**
   * Test the connection to Trello API
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.getUrl('/members/me');
      return true;
    } catch (error) {
      throw new ServiceError(error);
    }
  }

  /**
   * Get a board with all its lists
   */
  async getBoard(boardId: string): Promise<TrelloBoard> {
    try {
      const results = await this.getUrl<TrelloBoard>(`/boards/${boardId}`, { lists: 'all' });
      return results;
    } catch (error) {
      logger.error(error);
      throw new ServiceError(error);
    }
  }

  /**
   * Get a specific column/list by name from a board
   */
  async getColumn(boardId: string, columnName: string): Promise<TrelloList | null> {
    try {
      const board = await this.getBoard(boardId);

      return board.lists.find((list) => list.name === columnName) || null;
    } catch (error) {
      throw new ServiceError(error);
    }
  }

  /**
   * Get all cards in a specific column/list
   */
  async getCardsInColumn(listId: string): Promise<TrelloCard[]> {
    try {
      const results = await this.getUrl<TrelloCard[]>(`/lists/${listId}/cards`, { attachments: 'true' });
      return results;
    } catch (error) {
      logger.error(error);
      throw new ServiceError(error);
    }
  }

  /**
   * Get cards from a column by name (convenience method)
   */
  async getCardsInColumnByName(columnName: string): Promise<TrelloCard[]> {
    try {
      const column = await this.getColumn(this.boardId, columnName);
      if (!column) {
        throw new Error(`Colonne "${columnName}" non trouvée sur le board ${this.boardId}`);
      }
      return await this.getCardsInColumn(column.id);
    } catch (error) {
      throw new ServiceError(error);
    }
  }

  /**
   * Get all columns/lists from a board
   */
  async getColumns(boardId: string): Promise<TrelloList[]> {
    try {
      const board = await this.getBoard(boardId);
      return board.lists;
    } catch (error) {
      throw new ServiceError(error);
    }
  }

  /**
   * Get a specific card by ID
   */
  async getCard(cardId: string): Promise<TrelloCard> {
    try {
      return await this.getUrl<TrelloCard>(`/cards/${cardId}`, { attachments: 'true' });
    } catch (error) {
      throw new ServiceError(error);
    }
  }

  /**
   * Move a card to a different list
   */
  async moveCard(cardId: string, listId: string) {
    try {
      await this.putUrl(`/cards/${cardId}`, { idList: listId });
    } catch (error) {
      throw new ServiceError(error);
    }
  }

  async moveCardInColumnByName(cardId: string, columnName: string) {
    try {
      const column = await this.getColumn(this.boardId, columnName);
      if (!column) {
        throw new Error(`Colonne "${columnName}" non trouvée sur le board ${this.boardId}`);
      }
      await this.moveCard(cardId, column.id);
    } catch (error) {
      throw new ServiceError(error);
    }
  }

  async downloadAttachment(attachment: TrelloCard['attachments'][number]): Promise<string> {
    return await downloadFile({
      fileName: attachment.fileName,
      headers: { Authorization: `OAuth oauth_consumer_key="${this.apiKey}", oauth_token="${this.token}"` } as AxiosRequestHeaders,
      url: `${attachment.url}?${this.getAuthParams()}`,
    });
  }

  async downloadAttachments(attachments: TrelloCard['attachments']): Promise<string[]> {
    return await Promise.all(attachments.map((attachment) => this.downloadAttachment(attachment)));
  }
}
