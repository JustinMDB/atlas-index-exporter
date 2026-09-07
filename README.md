# Atlas Index Exporter

Atlas Index Exporter is a small Chrome extension for viewing and copying index definitions from MongoDB Atlas Performance Advisor.

It adds JSON controls directly to each list of existing indexes without changing the underlying Atlas data.

## Features

- View an individual index as formatted JSON.
- Copy an individual index definition.
- Toggle every index in one card between JSON and the standard Atlas rendering.
- Copy all indexes in one card as an ordered JSON array.
- Include the card's database and collection namespace in copied output.
- Handle index cards loaded dynamically as you navigate Atlas.

## Installation

Install from a release ZIP:

1. Download the ZIP from the repository's **Releases** page.
2. Extract the ZIP to a permanent folder.
3. Open `chrome://extensions` in Chrome.
4. Enable **Developer mode** in the upper-right corner.
5. Select **Load unpacked**.
6. Select the extracted folder containing `manifest.json`.
7. Open or reload MongoDB Atlas.

To install directly from a clone of this repository:

1. Clone or download this repository.
2. Open `chrome://extensions` in Chrome.
3. Enable **Developer mode** in the upper-right corner.
4. Select **Load unpacked**.
5. Select the repository folder containing `manifest.json`.
6. Open or reload MongoDB Atlas.

After pulling an update, select **Reload** for Atlas Index Exporter on the Chrome extensions page, then refresh the Atlas tab.

## Usage

1. Sign in to MongoDB Atlas.
2. Open a project's **Performance Advisor** index recommendations.
3. Expand an **Existing Indexes In This Collection** section.
4. Use the controls beside an index or the controls above the index list.

### Individual Index Controls

- **`{}`** toggles that index between formatted JSON and the standard Atlas rendering.
- **Copy icon** copies that index definition with its namespace header.

### Card Controls

- **Show All as JSON** displays every index in that card as formatted JSON.
- **Show All as Rendered** restores every index in that card to the standard Atlas rendering.
- **Copy All JSON** copies only the indexes in that card as one ordered array.

Each toolbar is scoped to its own collection card. Actions do not include indexes from other cards on the page.

## Copied Output

An individual index is copied in this form:

```js
// Namespace: demo_catalog.products
{
  "sku": 1,
  "updatedAt": -1,
  "isArchived": 1
}
```

**Copy All JSON** produces one array for the selected card:

```js
// Namespace: demo_catalog.products
[
  {
    "_id": 1
  },
  {
    "sku": 1,
    "updatedAt": -1
  }
]
```

The namespace is emitted as a JavaScript-style comment. Remove the first line if the destination requires strict JSON.

## Permissions And Privacy

The extension:

- Runs only on Atlas project routes under `https://cloud.mongodb.com/v2/*`.
- Requests no Chrome extension permissions.
- Reads only the rendered index summaries and namespaces needed for export.
- Does not send, store, or modify Atlas data.

Clipboard access occurs only when a copy button is selected.

## Limitations

- The extension depends on the rendered Atlas Performance Advisor markup. Atlas UI changes may require selector updates.
- Only indexes currently rendered in an expanded card are included.
- Exported index details are limited to the information displayed by the Atlas UI. Verify complete and authoritative index definitions using `db.collection.getIndexes()` or an equivalent MongoDB command.
- This is an independent utility and is not an official MongoDB product. It is provided as-is, without warranty.

## Development

The extension uses Manifest V3 with plain JavaScript and CSS. It has no build step or runtime dependencies.

Run the tests with Node.js:

```sh
node --test content.test.js
```

Check the content script syntax with:

```sh
node --check content.js
```

When testing UI changes, reload the unpacked extension and refresh the Atlas page.

### Build A Release

Update `version` in `manifest.json`, then run:

```sh
./scripts/build-release.sh
```

The script validates the content script and manifest version, runs the tests, and creates a versioned archive such as `dist/atlas-index-exporter-v1.0.0.zip`. It then verifies that the archive contains only the files Chrome needs, with `manifest.json` at its root.

Attach the generated ZIP to the matching GitHub release. GitHub's automatic source archives contain the full repository and are not the packaged extension artifact.

## Contributing

Bug reports and focused pull requests are welcome. For UI issues, include the relevant Atlas page area, expected behavior, and sanitized DOM markup when possible. Do not include customer names, project identifiers, namespaces, query text, or other sensitive data in issues or screenshots.