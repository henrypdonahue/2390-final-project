# Session based MPC with deletion

## Installation

```bash
npm install
```

## Running

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
node input-party.js input <token/email> 100
```

Delete data before analyst runs compute

```bash
node input-party.js delete <token/email>
```

End the session in the analyst terminal by hitting enter

### Automatic

```bash
make run
```

Input in the 3rd window as the input party

### Test

```bash
sh /file/pagth/to/input.sh
```

## Formatting

```bash
npm run lint
npm run format
```