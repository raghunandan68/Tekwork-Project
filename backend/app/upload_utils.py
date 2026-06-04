"""Upload utility — parse CSV or Excel files into a list of row dicts."""

import csv
import io
from typing import List, Dict, Any

from fastapi import UploadFile, HTTPException


async def parse_upload(file: UploadFile, required_columns: List[str]) -> List[Dict[str, Any]]:
    """
    Read an uploaded .csv or .xlsx file and return a list of row dictionaries.
    Validates that all required_columns are present as headers.
    Raises HTTP 400 if the file type is unsupported or required columns are missing.
    """
    filename = (file.filename or "").lower()
    content = await file.read()

    if filename.endswith(".csv"):
        rows = _parse_csv(content, required_columns)
    elif filename.endswith(".xlsx") or filename.endswith(".xls"):
        rows = _parse_excel(content, required_columns)
    else:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type. Please upload a .csv or .xlsx file.",
        )

    return rows


def _parse_csv(content: bytes, required_columns: List[str]) -> List[Dict[str, Any]]:
    text = content.decode("utf-8-sig", errors="replace")
    reader = csv.DictReader(io.StringIO(text))

    # Normalise header names (strip whitespace, lowercase for checking)
    headers = [h.strip() for h in (reader.fieldnames or [])]
    _validate_columns(headers, required_columns)

    rows = []
    for row in reader:
        cleaned = {k.strip(): (v.strip() if isinstance(v, str) else v) for k, v in row.items() if k}
        if any(cleaned.values()):          # skip fully blank rows
            rows.append(cleaned)
    return rows


def _parse_excel(content: bytes, required_columns: List[str]) -> List[Dict[str, Any]]:
    try:
        import openpyxl
    except ImportError:
        raise HTTPException(status_code=500, detail="openpyxl not installed. Cannot parse Excel files.")

    wb = openpyxl.load_workbook(io.BytesIO(content), read_only=True, data_only=True)
    ws = wb.active

    row_iter = ws.iter_rows(values_only=True)
    header_row = next(row_iter, None)
    if header_row is None:
        raise HTTPException(status_code=400, detail="Excel file is empty.")

    headers = [str(h).strip() if h is not None else "" for h in header_row]
    _validate_columns(headers, required_columns)

    rows = []
    for row in row_iter:
        if all(v is None for v in row):   # skip blank rows
            continue
        row_dict = {headers[i]: (str(v).strip() if v is not None else "") for i, v in enumerate(row)}
        rows.append(row_dict)

    wb.close()
    return rows


def _validate_columns(headers: List[str], required: List[str]):
    lower_headers = [h.lower() for h in headers]
    missing = [col for col in required if col.lower() not in lower_headers]
    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"Missing required column(s): {', '.join(missing)}. "
                   f"Found columns: {', '.join(headers)}",
        )


def coerce_row(row: Dict[str, Any], column_map: Dict[str, str]) -> Dict[str, Any]:
    """
    Return a new dict using normalised column names (case-insensitive lookup).
    column_map: { 'target_key': 'expected_header' }
    """
    lower_row = {k.lower(): v for k, v in row.items()}
    return {target: lower_row.get(header.lower(), "") for target, header in column_map.items()}
