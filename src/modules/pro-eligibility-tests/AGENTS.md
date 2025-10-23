# Pro Eligibility Tests Module

This module handles eligibility testing for professional users who want to check if multiple addresses are eligible for district heating network connections. It allows bulk import and processing of address data through CSV files.

## Purpose

Professional users can upload CSV files containing multiple addresses and test their eligibility for connection to district heating networks. The system processes addresses in batches, geocodes them, and determines proximity to existing networks.

## Module Structure

### Client Components (`client/`)

- **`UpsertEligibilityTestForm.tsx`** - Main form for creating/updating eligibility tests with CSV upload
- **`CSVImportTable.tsx`** - Preview table for CSV data with column mapping interface  
- **`TestsAddressesAdminPage.tsx`** - Admin interface for managing all eligibility tests
- **`TestsAdressesPage.tsx`** - User interface for viewing their own tests
- **`ProEligibilityTestItem.tsx`** - Individual test item display component
- **`ProcheReseauBadge.tsx`** - Badge showing proximity to district heating network
- **`RenameEligibilityTestForm.tsx`** - Simple form for renaming existing tests

### Server Services (`server/`)

- **`service.ts`** - Core business logic for CRUD operations on eligibility tests
- **`api.ts`** - REST API endpoints for user operations
- **`api-admin.ts`** - Admin-only API endpoints
- **`trpc-routes.ts`** - tRPC route definitions
- **`jobs.ts`** - Background job processing for batch address analysis

### Utilities (`utils/`)

- **`csvColumnDetection.ts`** - Automatic detection and mapping of CSV columns
- **`xlsx.ts`** - Excel file parsing utilities

### Constants (`constants.tsx`)

Zod schemas and validation rules:
- `zCreateEligibilityTestInput` - Validation for creating new tests
- `zUpdateEligibilityTestInput` - Validation for updating tests  
- `zColumnMapping` - CSV column mapping validation
- File size limits and allowed extensions

## Key Features

### CSV Processing
- Supports CSV and TXT files up to 50MB
- Automatic delimiter detection (comma, semicolon, tab)
- Column header detection
- Preview with data mapping interface

### Address Input Methods
- **Address strings**: Requires address column for geocoding
- **Coordinates**: Requires both latitude and longitude columns
- Cannot mix address and coordinate inputs in same test

### Column Mapping Validation
```typescript
// Must have either address OR coordinates (not both)
const hasAddress = data.addressColumn !== undefined;
const hasCoordinates = data.latitudeColumn !== undefined && data.longitudeColumn !== undefined;
return hasAddress || hasCoordinates && !(hasAddress && hasCoordinates);
```

### Background Processing
- Tests are processed asynchronously using job queues
- Status tracking: pending, processing, completed, error
- Batch geocoding of addresses
- Distance calculation to nearest networks

## Usage Examples

### Creating a New Test

```typescript
// Client usage
const { create } = useCrud('/api/pro-eligibility-tests');

const testData = {
  name: "Quartier résidentiel Nord",
  content: "adresse,code_postal\n123 Rue de la Paix,75001\n456 Avenue Victor Hugo,75002",
  hasHeaders: true,
  separator: ",",
  dataType: "address",
  columnMapping: {
    addressColumn: 0
  }
};

await create(testData);
```

### Admin Operations

```typescript
// List all tests (admin only)
const tests = await listAdmin();

// Each test includes:
// - Basic test info (name, created_at, user_id)
// - User email
// - Job status (has_pending_jobs, last_job_has_error)
```

### CSV Analysis

```typescript
import { analyzeCSV } from './utils/csvColumnDetection';

const analysis = analyzeCSV({
  content: csvString,
  separator: ',',
  hasHeaders: true
});

// Returns:
// {
//   headers: string[],
//   sampleRows: string[][],
//   suggestedMapping: ColumnMapping
// }
```

## Database Schema

The module works with the `pro_eligibility_tests` table:
- `id` - Primary key
- `user_id` - Foreign key to users table
- `name` - Test name (max 100 chars)
- `created_at` - Timestamp
- `deleted_at` - Soft delete timestamp

Background processing uses the `jobs` table to track async operations.

## API Endpoints

### User Endpoints (`/api/pro-eligibility-tests`)
- `GET /` - List user's tests
- `POST /` - Create new test
- `PUT /:id` - Update existing test
- `DELETE /:id` - Delete test

### Admin Endpoints (`/api/admin/pro-eligibility-tests`)
- `GET /` - List all tests with user info and job status

## File Constraints

- **Max file size**: 50MB
- **Allowed extensions**: .csv, .txt
- **Encoding**: Auto-detection with fallback to UTF-8
- **Separators**: Comma, semicolon, tab, or custom

## Error Handling

The module includes comprehensive error handling:
- File validation (size, type, content)
- CSV parsing errors with user-friendly messages
- Column mapping validation
- Background job error tracking
- Graceful fallbacks for encoding issues

## Integration Points

- **Authentication**: Requires logged-in user context
- **Geocoding**: Integration with address geocoding services
- **Network Data**: Uses PostGIS spatial queries against `reseaux_de_chaleur` table
- **Job Queue**: Background processing for large datasets
- **Events**: User action logging through events module