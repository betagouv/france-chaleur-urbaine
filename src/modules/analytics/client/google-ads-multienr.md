# Google Ads tracking for the multi-energy simulator

## Deployment

Set `NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID=GTM-T9RP6ZXL` in the target environment **before building**. There is no hardcoded container default; an unset or empty value disables this integration. For local acceptance, launch with `NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID=GTM-T9RP6ZXL pnpm dev` and intercept Google requests or use GTM preview. Apply `20261109120000_ccrt_acquisition` before deploying the application. Do not add this container through a second integration.

The site loads GTM only after the visitor accepts the DSFR consent purpose “Google Ads”. There is no consent-bypassing noscript iframe. Before any Google loader or conversion, the application queues denied Consent Mode v2 defaults, then grants `ad_storage` and `ad_user_data` only after acceptance; `analytics_storage` and `ad_personalization` stay denied. The new `google_ads` consent purpose replaces the old Analytics purpose; DSFR includes purpose names in its persistence key, so previous choices require a fresh decision. A first refusal does not reload the page, preserving in-memory acquisition. Withdrawal sends denied consent then reloads to unload the scripts. The loader is excluded from admin and iframe pages. GTM is the only Google integration; legacy direct conversions and their environment variable have been removed. Entering admin/iframe pages after GTM loads uses a document navigation to unload it.

## Event contract

Events use the standard `window.dataLayer`. No names, email addresses, telephone numbers, addresses, building identifiers or simulation inputs are added to these payloads. `page_location` and `page_referrer` retain only `utm_id`, `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`, `gclid`, `gbraid` and `wbraid`; fragments and other parameters are removed. Campaign parameters must never contain personal data. This is an application payload guarantee only, not proof of the external container’s automatic collection behavior.

| Event | Trigger | Properties |
| --- | --- | --- |
| `multienr_simulation_completed` | Results ready: router, address lookup, building selection and prefill resolved | `simulation_id`, `event_id`, `page_location` |
| `multienr_accompaniment_submitted` | Server confirms a newly created demand | `simulation_id`, `demand_id`, `demand_type`, `event_id`, `page_location` |

`demand_type` is `ccrt` for dedicated accompaniment and `heat_network` for connection requests created from the simulator. A failed submission, unavailable CCRT collection, deduplicated classic demand, form opening, CTA click or France Rénov appointment click does not emit a demand conversion.

Each simulation event is deduplicated by simulation UUID during the current page lifetime, including React effect replays and input changes. Changing the address/building starts a new simulation. Reloading starts a new simulation, consistent with first-party simulation tracking. Demand conversions are deduplicated by demand UUID. `event_id` is `${event}:${simulation_id}` or `${event}:${demand_id}` respectively.

## GTM / Google Ads handoff to Dentsu

The supplied Google Ads destination is `AW-18521951422` (numeric conversion ID `18521951422`). Two actions have been created:

| Google Ads action | Conversion label | Application event | Condition | Transaction ID |
| --- | --- | --- | --- | --- |
| MultiENR — Simulation terminée | `bJqQCJ6nj7UdEL6Z-v9E` | `multienr_simulation_completed` | Production hostname | `simulation_id` |
| MultiENR — Demande CCRT | `j5_YCKGnj7UdEL6Z-v9E` | `multienr_accompaniment_submitted` | Production hostname and `demand_type=ccrt` | `demand_id` |

There is currently no Google Ads action/label for heat-network demands. The application still emits `demand_type=heat_network` after successful creation, but the supplied import deliberately does not map these events to the CCRT action. The repository does not publish changes to Google Ads or GTM.

Retrieve each action's label in Google Ads: Goals → Conversions → Summary → select the action → Tag setup → Use Google Tag Manager. Alternatively, provide its full `send_to` value (`AW-18521951422/CONVERSION_LABEL`). The Ads destination ID alone does not identify a conversion action. See [Google's conversion ID and label instructions](https://support.google.com/tagmanager/answer/6105160?hl=en).

Use container `GTM-T9RP6ZXL` with destination `AW-18521951422`. The published container exercised on 2026-11-12 includes the Ads destination and both MultiENR conversion tags. Automatic user-provided data detection is disabled; the published resource still enables automatic form/history detection, which must be checked in the destination settings before activation. Only the explicit conversion events below are intended. The import disables enhanced conversions on its two conversion tags, but does not change these existing container/destination settings.

## Import the supplied configuration

File: [gtm-multienr-conversions.json](./gtm-multienr-conversions.json).

The partial import adds **2 Google Ads conversion tags, 2 custom-event triggers, 3 Data Layer Variables and the Page Hostname built-in variable**, grouped in one MultiENR folder. Both triggers require `france-chaleur-urbaine.beta.gouv.fr`. It reuses the already-published `AW-18521951422` destination; it does not add a second Google base tag or a Conversion Linker. The `0` account/container IDs in the file are portable source metadata; choose the actual target container in GTM.

1. Open `GTM-T9RP6ZXL` in Google Tag Manager. Export the current workspace as a backup.
2. Open **Admin → Import Container** and select the JSON file. Choose a new workspace named `MultiENR conversions`.
3. Choose **Merge**, preserving unrelated tags. On the first import, rename conflicting items and inspect any conflict before confirming; if these same conversion tags are already present, update them rather than leaving duplicate conversion tags. Inspect the detailed changes: no unrelated item should be deleted. Importing into a workspace does not publish it.
4. In the existing Ads destination, complete the privacy/URL configuration described below. These existing settings are not overwritten by the partial import.
5. Deploy the application with the configured environment variable before acceptance testing. In GTM **Preview**, test the production hostname: simulation completion fires the simulation tag; a newly created CCRT demand fires the CCRT tag; a heat-network demand, failed submission or classic duplicate does not fire the CCRT tag. Refusing Google consent prevents the GTM loader itself from loading.
6. Check that the Google Ads requests contain no address/contact values or result URLs containing non-allowlisted query parameters, and that transaction IDs use the UUID fields. Then publish the reviewed workspace with **Submit → Publish**.

The file is validated locally for JSON structure, tag/trigger/variable references, labels and trigger filtering. GTM import validation and live delivery in Tag Assistant/Google Ads still require access to the target account. Reference: [Google's import and merge procedure](https://support.google.com/tagmanager/answer/6106997?hl=en).

## Destination configuration and future conversion actions

1. Create Custom Event triggers for the two exact event names above. Restrict production conversion tags to the production hostname. For separate accompaniment and connection actions, add a `demand_type` condition to each demand trigger.
2. Create Data Layer Variables for `demand_type`, `simulation_id`, `demand_id` and `page_location`. Use `simulation_id` as the simulation conversion transaction ID, and `demand_id` for demand conversions. These UUIDs fit Google's 64-character limit; the application-level `event_id` includes an event-name prefix and is too long for a Google Ads transaction ID. Select an appropriate Google Ads count setting for each action. See [Google's transaction ID requirements](https://support.google.com/google-ads/answer/6386790?hl=en).
3. Configure Google Ads conversion tags with the provided conversion ID/label and those triggers. The supplied import reuses the existing Ads destination, which already initializes Google tracking after site consent; do not duplicate it with another base tag or Conversion Linker.
4. The application sets allowlisted `page_location` and `page_referrer` globally before GTM initializes, refreshes them on consented public navigation and passes them explicitly to simulator events. If a Google tag in GTM overrides these parameters, use the built-in Page Hostname and Page Path variables to set `page_location` to `https://{{Page Hostname}}{{Page Path}}` for the HTTPS production site; never override the application's safeguards with raw Page URL or referrer variables. Simulator query strings contain an address and may contain an original demand identifier: do not send raw Page URL, Page Path + Query, referrer query strings, form values or user-provided data. Keep automatic enhanced conversions, form collection and history measurement disabled on this destination. Use built-in templates and Data Layer Variables, rather than Custom HTML or Custom JavaScript requiring a weaker CSP.
5. Do not import the same conversions through GA4 as additional primary conversions, or reuse the legacy FCU conversion label for these events. Distinct simulation and demand actions may exist, but only the intended optimization goal should be primary.

Reference: [Google's data layer guide](https://developers.google.com/tag-platform/devguides/datalayer), [basic consent mode](https://developers.google.com/tag-platform/security/guides/consent?consentmode=basic), [Google Ads CSP requirements](https://developers.google.com/tag-platform/security/guides/csp#google_ads).

## Acquisition on demands

Both public forms retain the latest UTM/click-tagged arrival in memory across internal navigation, falling back to `mtm_source`, `mtm_medium`, `mtm_campaign` and `mtm_kwd` links when no UTM/click arrival is present. Campaigns are never mixed across the two naming schemes. Embedded classic forms retain this first-party attribution without loading Google; admin pages are excluded. It is attached when submitting a demand, independently of third-party consent. This first-party capture writes no cookie or browser storage and does not survive a full reload or a new tab. A new tagged arrival replaces the previous campaign; untagged internal navigation preserves it.

The presence of `gclid`, `gbraid` or `wbraid` identifies a Google Ads arrival (`source=google`, `medium=cpc`); the raw click identifier is discarded by this attribution code. A Google source with a paid-search medium (`cpc`, `ppc`, `paidsearch`, `paid_search`) is displayed as “Google Ads”. Missing campaign data remains missing: the application does not look up campaign names in Google Ads. Client-supplied acquisition is informational and grants no permissions. Values are bounded to 200 characters and validated by the server.

Add UTMs to the campaign destination, for example `?utm_source=google&utm_medium=cpc&utm_campaign=chauffage_renouvelable` (or a stable campaign ID). Google auto-tagging alone cannot provide a campaign name in the admin UI.

- CCRT demands store the acquisition in a nullable JSONB column. The admin list displays it, searches source/campaign and includes it in Excel exports. The CCRT professional API does not expose it. Historical demands remain unattributed.
- Classic forms and simulator demands use the same `acquisition` input and raw source/medium/campaign values; legacy API `mtm_*` inputs remain supported. Classic demands store these in `Campagne source` / `Campagne medium` / `Campagne matomo` (optional keyword in `Campagne keywords`). The admin table has no acquisition columns or filters. Deduplication preserves the original demand’s attribution. Legacy localStorage campaigns are no longer read.

## Acceptance checks

1. Use a test container or GTM preview with production conversion tags disabled on the test hostname. Start a fresh browser context on a tagged landing page.
2. Before consent and after refusal: no Google loader request and no `multienr_*` events. A first refusal does not reload. After consent: exactly one GTM loader, even across client navigation; Consent Mode shows granted advertising storage/measurement and denied analytics storage/personalization. Withdrawal sends denied consent and reloads.
3. Complete a simulation: one simulation event after building confirmation/prefill. Change input values without changing the building: no additional simulation conversion. Change building: one event for the new simulation.
4. Submit one CCRT demand and one eligible network demand: one application event after each successful response, with the corresponding `demand_type`. Only the CCRT event fires a Google Ads demand conversion in the supplied import. Check API failures, outside-coverage responses and classic duplicates produce no application demand conversion.
5. Verify raw source/medium/campaign in classic demand storage, the CCRT admin display/search/export and non-disclosure in the professional CCRT response. Test missing UTMs and click auto-tagging without a campaign.
6. In Tag Assistant, confirm the intended conversion tag fires once, page URLs are sanitized and no requests violate CSP. Validate the conversion actions in Google Ads with Dentsu before enabling campaign optimization.

## Review verification (2026-11-12)

A Chromium harness ran the actual published `GTM-T9RP6ZXL` script on an intercepted production-host document, using the application’s Google helper. It injected sentinel address/email/original-demand query parameters and form fields, allowed Google loader scripts, and intercepted/aborted all measurement requests before delivery. Initialization, a simulation conversion, a fake form submission, a history change and a CCRT conversion were exercised. None of the 13 intercepted requests contained the private sentinel values. Both conversion labels and their respective UUID transaction IDs were observed; conversion URLs retained allowlisted UTM/click parameters. The container also attempted automatic `page_view` requests at initialization (query-free URLs in this run).

This check does not run the full Next.js journey, prove Google Ads receipt/counting, cover every automatic collection trigger, or validate future container changes. A complete Tag Assistant/network acceptance check remains required before activation. Measurement requests were blocked deliberately, so this run created no Google Ads conversions. The existing container’s automatic collection settings must still be reviewed.
