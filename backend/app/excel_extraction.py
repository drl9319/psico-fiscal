import pandas as pd
import json
import logging

logger = logging.getLogger("uvicorn.error")

# Expected columns in the Excel file (Spanish → English mapping).
# "Cliente" IS the customer name — it maps to `supplier_name` so the
# frontend data-table's "Cliente" column displays the actual customer.
REQUIRED_COLUMNS = {
    'Número': 'invoice_number',
    'Fecha': 'accounting_date',
    'Cliente': 'supplier_name',      # → "Cliente" column in the table
    'Subtotal con dto.': 'subtotal', # → "Subtotal" column in Excel data table
    'BI 0%': 'tax_base_zero',
    'Imp. 0%': 'tax_amount_zero',
    'Total factura': 'total',
    'NIF cliente': 'customer_id',
}

# Optional columns — included in output if present in the Excel file
OPTIONAL_COLUMNS = {
    'Emisor': 'emisor_name',         # Business issuer (Esther Truyo Sanchez)
    'NIF emisor': 'emisor_id',       # Business issuer tax ID
}


def extract_excel_data(file_path: str):
    """
    Reads an Excel file, extracts specific columns, and returns the data as a JSON object.

    Uses the 'calamine' engine (Rust-based via python-calamine) which is more robust
    than openpyxl at handling malformed worksheet metadata (e.g., empty page setup
    attributes like fitToHeight="" that crash openpyxl with "expected <class 'int'>").

    Reads all data as strings to also avoid type-inference issues from openpyxl.

    Args:
        file_path (str): The path to the Excel file.

    Returns:
        str: A JSON string containing the extracted data.
    """
    # Use calamine engine (Rust-based) to avoid openpyxl XML parsing bugs
    # with corrupted page setup attributes. Fall back to openpyxl if calamine
    # is not available.
    try:
        import python_calamine  # noqa: F401
        df = pd.read_excel(file_path, dtype=str, keep_default_na=False, engine='calamine')
    except ImportError:
        logger.warning("python-calamine not available, falling back to openpyxl")
        df = pd.read_excel(file_path, dtype=str, keep_default_na=False)

    # Validate that all required columns exist
    missing = [col for col in REQUIRED_COLUMNS if col not in df.columns]
    if missing:
        raise ValueError(
            f"El archivo Excel no contiene las columnas requeridas: {missing}. "
            f"Columnas encontradas: {list(df.columns)}"
        )

    # Select required columns
    cols_to_select = list(REQUIRED_COLUMNS.keys())

    # Add optional columns if they exist in the file
    for col in OPTIONAL_COLUMNS:
        if col in df.columns:
            cols_to_select.append(col)

    df_filtered = df[cols_to_select].copy()

    # Build the full rename map (required + optional)
    rename_map = {**REQUIRED_COLUMNS}
    for col in OPTIONAL_COLUMNS:
        if col in df.columns:
            rename_map[col] = OPTIONAL_COLUMNS[col]

    df_filtered.rename(columns=rename_map, inplace=True)

    # Filter out rows where invoice_number (Número) is empty
    # This removes blank lines and auto-generated totals rows at the bottom.
    df_filtered = df_filtered[df_filtered['invoice_number'].str.strip() != ''].copy()

    # Data masking for confidentiality
    # "Cliente" → supplier_name — truncate to first word
    df_filtered['supplier_name'] = df_filtered['supplier_name'].str.split().str.get(0)

    # Keep only last 4 characters of customer_id (NIF)
    if 'customer_id' in df_filtered.columns:
        df_filtered['customer_id'] = df_filtered['customer_id'].astype(str).str.strip().str[-4:]

    # Mask emisor_id too if present
    if 'emisor_id' in df_filtered.columns:
        df_filtered['emisor_id'] = df_filtered['emisor_id'].astype(str).str.strip().str[-4:]

    # Convert 'Fecha' to ISO format — handle two possible formats:
    #   1. European text format  "08/04/2026" → dayfirst=True
    #   2. ISO datetime string    "2026-04-08 00:00:00" → dayfirst=False (default)
    # Detect format: if the first value contains "-" (ISO), parse without dayfirst.
    sample = df_filtered['accounting_date'].dropna().iloc[0] if not df_filtered['accounting_date'].dropna().empty else ''
    if '-' in str(sample):
        # ISO format (from Excel serial date) — no dayfirst
        df_filtered['accounting_date'] = pd.to_datetime(
            df_filtered['accounting_date'], errors='coerce'
        ).dt.date.astype(str)
    else:
        # European format (dd/mm/yyyy) — dayfirst=True
        df_filtered['accounting_date'] = pd.to_datetime(
            df_filtered['accounting_date'], errors='coerce', dayfirst=True
        ).dt.date.astype(str)

    # Replace 'NaT' (from failed date parsing) and None with empty string
    df_filtered['accounting_date'] = df_filtered['accounting_date'].replace('NaT', '')

    # Ensure numeric columns are converted properly (they're strings at this point)
    numeric_cols = ['subtotal', 'tax_base_zero', 'tax_amount_zero', 'total']
    for col in numeric_cols:
        df_filtered[col] = (
            df_filtered[col]
            .str.replace(',', '.', regex=False)   # European decimal comma → dot
            .str.replace(r'[^\d.\-]', '', regex=True)  # strip currency symbols, spaces
            .replace('', '0')                        # empty → 0
            .astype(float)
        )

    df_filtered = df_filtered.fillna("")
    return json.dumps(df_filtered.to_dict(orient='records'), indent=4, ensure_ascii=False, default=str)

if __name__ == '__main__':
    # Example usage:
    # Create a dummy Excel file for testing
    data = {
        'Número': ['INV001', 'INV002'],
        'Fecha': ['2023-01-15', '2023-02-20'],
        'Cliente': ['Client A', 'Client B'],
        'Subtotal': [100.00, 200.00],
        'Subtotal con dto.': [90.00, 180.00],
        'BI 0%': [0.00, 10.00],
        'Total factura': [121.00, 242.00],
        'Other Column': ['foo', 'bar']
    }
    dummy_df = pd.DataFrame(data)
    dummy_file_path = 'dummy_invoices.xlsx'
    dummy_df.to_excel(dummy_file_path, index=False)

    json_output = extract_excel_data(dummy_file_path)
    print(json_output)
