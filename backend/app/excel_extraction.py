import pandas as pd
import json

def extract_excel_data(file_path: str):
    """
    Reads an Excel file, extracts specific columns, and returns the data as a JSON object.

    Args:
        file_path (str): The path to the Excel file.

    Returns:
        str: A JSON string containing the extracted data.
    """
    df = pd.read_excel(file_path)

    # Select and rename columns
    df_filtered = df[[
        'Número',
        'Fecha',
        'Cliente',
        'Subtotal',
        'Subtotal con dto.',
        'BI 0%',
        'Total factura'
    ]].copy()

    df_filtered.rename(columns={
        'Número': 'invoice_number',
        'Fecha': 'accounting_date',
        'Cliente': 'customer_name',
        'Subtotal': 'subtotal',
        'Subtotal con dto.': 'subtotal_discounted',
        'BI 0%': 'tax_base_zero',
        'Total factura': 'total'
    }, inplace=True)

    # Convert 'Fecha' to ISO format
    df_filtered['accounting_date'] = pd.to_datetime(df_filtered['accounting_date']).dt.date.astype(str)
    df_filtered = df_filtered.fillna("")
    return json.dumps(df_filtered.to_dict(orient='records'), indent=4)

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
