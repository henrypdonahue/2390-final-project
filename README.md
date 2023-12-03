# Session based MPC with deletion

## Installation

```bash
npm install
```

## Running

### Automatic

```bash
make run
```

### Manual

Run the server first with

```bash
node server.js
```

Run the analyst with

```bash
node analyst.js
```

Input data with

```bash
node input-party.js input 100
```

Delete data before analyst runs compute

```bash
node input-party.js delete <token>
```

End the session in the analyst terminal by hitting enter

## Formatting

```bash
npm run lint
npm run format
```
