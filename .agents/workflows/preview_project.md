# Preview Project Workflow

This workflow describes how to run the project in development and production preview modes.

## Development Mode
Run the project with hot-reloading for local development.
```powershell
npm run dev -- --port 3001
```
The application will be available at [http://localhost:3001](http://localhost:3001).

## Production Preview
Build the project and run the production server locally.
1.  Build the project:
    ```powershell
    npm run build
    ```
2.  Start the production server:
    ```powershell
    npm run start -- --port 3001
    ```
The application will be available at [http://localhost:3001](http://localhost:3001).
