import styled, { keyframes } from 'styled-components';

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  max-width: 100%;

  > h2 {
    color: #000074;
  }

  @media (max-width: 576px) {
    margin: 0;
  }
`;

export const ImageContainer = styled.div`
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;

  > img {
    width: 100%;
    max-width: 400px;
    border-radius: 100%;
  }
`;

export const CarrouselBodyWrapper = styled.div`
  position: relative;
  flex: 1;

  display: flex;
  flex-direction: row;
  overflow: hidden;
`;
export const CarrouselBodyChild = styled.div<{ position: number }>`
  top: 0;
  left: 0;
  opacity: 0;
  min-width: 100%;
  transform: ${({ position }) => `translateX(-${position * 100}%)`};
  transition: opacity 0.5s ease;

  &.selected {
    opacity: 1;
  }
`;

const countdownPoint = keyframes`
  from { transform: scaleX(1); }
  to { transform: scaleX(0); }
`;
export const NavContainer = styled.div`
  display: flex;
`;
export const NavPoint = styled.div`
  position: relative;
  overflow: hidden;
  font-size: 0.9rem;
  background-color: #dde0e4;
  border-radius: 1em;
  width: 1em;
  height: 1em;
  margin: 0.25em;
  transition: width 0.5s ease, background-color 0.5s ease;

  &:first-child {
    margin-left: 0;
  }
  &:last-child {
    margin-right: 0;
  }

  ::before {
    transform-origin: left center;
    will-change: right;
  }

  &.selected {
    width: 3em;

    ::before {
      content: '';
      display: block;
      position: absolute;
      background-color: #4550e5;
      border-radius: 1em;
      top: 0;
      left: 0;
      bottom: 0;
      right: 0;

      transition: width 0.5s ease, right 0.5s ease, background-color 0.5s ease;
      animation: ${countdownPoint} linear;
      animation-duration: ${({ duration }: { duration: number }) =>
        `${duration}s`};
    }
  }
`;
