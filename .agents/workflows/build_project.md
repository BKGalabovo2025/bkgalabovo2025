# Build Project Workflow

This workflow describes how to install dependencies and build the project for production.

## Steps

1.  **Install Dependencies**
    Ensure all required packages are installed.
    ```powershell
    npm install
    ```

2.  **Run Checks and Tests**
    Run linting, typechecking, duplicate code analysis, and unit tests to ensure code quality.
    ```powershell
    npm run check-all
    ```

3.  **Build Project**
    Create an optimized production build.
    ```powershell
    npm run build
    ```

4.  **Run Lighthouse Audits** (Optional)
    Generate performance and accessibility reports.
    ```powershell
    npm run lighthouse
    ```
