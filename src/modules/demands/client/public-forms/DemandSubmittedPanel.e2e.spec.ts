import { expect, test } from '@playwright/test';

/**
 * Vérifie le panneau de confirmation après dépôt d'une demande (DemandSubmittedPanel) :
 * 1er dépôt -> "Demande de mise en relation bien reçue" ; re-dépôt (même email + adresse) -> "Demande déjà enregistrée" (dédup 30 jours).
 * L'autocomplétion BAN est mockée (adresse déterministe, éligible en base de dev) pour éviter la dépendance externe.
 */

// Feature BAN figée (adresse réelle éligible près du réseau de Lille) renvoyée pour toute recherche.
const BAN_SEARCH_RESPONSE = {
  attribution: 'BAN',
  features: [
    {
      geometry: { coordinates: [3.092367, 50.634201], type: 'Point' },
      properties: {
        city: 'Lille',
        citycode: '59350',
        context: '59, Nord, Hauts-de-France',
        housenumber: '10',
        id: '59350_7519_00010',
        importance: 0.79682,
        label: '10 Rue de Rivoli 59800 Lille',
        name: '10 Rue de Rivoli',
        postcode: '59800',
        score: 0.98,
        street: 'Rue de Rivoli',
        type: 'housenumber',
        x: 706545.87,
        y: 7059696.2,
      },
      type: 'Feature',
    },
  ],
  licence: 'ETALAB-2.0',
  limit: 10,
  query: '10 rue de rivoli',
  type: 'FeatureCollection',
  version: 'draft',
};

test.describe('DemandSubmittedPanel (espace public)', () => {
  test('nouvelle demande puis doublon (dédup 30 jours)', async ({ page }) => {
    test.setTimeout(120_000);
    const email = `e2e-dedup-${Date.now()}@example.com`;

    // Mock BAN : toute recherche d'adresse renvoie la même feature déterministe.
    await page.route('**/geocodage/search**', (route) =>
      route.fulfill({ body: JSON.stringify(BAN_SEARCH_RESPONSE), contentType: 'application/json', status: 200 })
    );

    const submitDemand = async () => {
      await page.goto('/', { waitUntil: 'domcontentloaded' });

      // Bannière cookies DSFR (rendu asynchrone) : on attend puis on l'accepte si elle apparaît,
      // sinon on continue (déjà acceptée au 2e passage). Sans ça elle intercepte les clics du formulaire.
      await page
        .getByRole('button', { name: 'Tout accepter' })
        .click({ timeout: 8_000 })
        .catch(() => {});

      // Inputs DSFR (radio/checkbox) : le <label> intercepte le clic et le hero anime la page -> check forcé.
      await page.getByLabel('Collectif', { exact: true }).check({ force: true });

      const addressInput = page.getByPlaceholder('Tapez ici votre adresse');
      await addressInput.fill('10 rue de rivoli');
      await page
        .getByRole('option', { name: /Rivoli/i })
        .first()
        .click({ force: true, timeout: 15_000 });

      const testButton = page.getByRole('button', { name: 'Tester cette adresse' });
      await expect(testButton).toBeEnabled();
      await testButton.click({ force: true });

      await page.getByLabel(/Vous êtes/).selectOption('Maison individuelle');
      await page.getByLabel('Nom', { exact: true }).fill('Dupont');
      await page.getByLabel('Prénom').fill('Jean');
      await page.getByLabel('Email').fill(email);
      await page.getByLabel(/énergie de chauffage/i).selectOption('gaz');
      await page.getByRole('checkbox', { name: /conditions générales/i }).check({ force: true });
      await page.getByRole('button', { exact: true, name: 'Envoyer' }).click();
    };

    // Cas 1 — nouvelle demande
    await submitDemand();
    await expect(page.getByText('Demande de mise en relation bien reçue')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText('Accusé de réception')).toBeVisible();
    await page.screenshot({ fullPage: true, path: 'test-results/demand-submitted-new.png' });

    // Cas 2 — même email + adresse < 30 jours -> doublon
    await submitDemand();
    await expect(page.getByText('Demande déjà enregistrée')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText('Votre dernière demande')).toBeVisible();
    await page.screenshot({ fullPage: true, path: 'test-results/demand-submitted-existing.png' });
  });
});
