# services/mapper.py — Stage 2: Map industries using the reference workbook

import pandas as pd

from core.config import MAPPER_DROP_COLUMNS


def run_mapper(formatted_path: str, mapping_path: str, out_path: str) -> None:
    """
    Merge the formatted Excel with the industry-mapping workbook to attach
    mapped_industry, SCS_Sector, and KPI_Template columns, then write to CSV.

    Args:
        formatted_path: Path to the Stage-1 formatted .xlsx.
        mapping_path:   Path to the industry-mapping .xlsx workbook.
        out_path:       Path where the mapped CSV will be written.
    """
    # FIX 1: Don't hardcode "Sheet1" — formatter writes the first (and only) sheet,
    # whose name varies by pandas/openpyxl version. Use sheet_name=0 to always read
    # the first sheet regardless of its name.
    df_query = pd.read_excel(formatted_path, sheet_name=0)

    # Keep only the columns we actually need from the mapping file before merging.
    # This prevents any overlapping column names from the mapping sheet (e.g. a
    # "Sector" or "Name" column) from producing "Sector_x / Sector.1" duplicates.
    df_mapping = pd.read_excel(mapping_path, sheet_name="Industry Mapping")
    df_mapping.columns = [c.strip() for c in df_mapping.columns]
    df_mapping = df_mapping[
        [c for c in ["190_Industry", "SCS Sectors", "Template", "Economic Model"]
         if c in df_mapping.columns]
    ]

    merged_df = pd.merge(
        df_query,
        df_mapping,
        left_on="Industry",
        right_on="190_Industry",
        how="left",
    )

    # Assign the three derived columns before dropping source cols
    merged_df["mapped_industry"] = merged_df.get("Industry")   # Industry already on left
    merged_df["SCS_Sector"]      = merged_df.get("SCS Sectors")
    merged_df["KPI_Template"]    = merged_df.get("Template")

    # FIX 2: Drop ALL columns introduced by the mapping join so no "_x / _y / .1"
    # suffixes or raw mapping columns leak into the output.
    cols_to_drop = MAPPER_DROP_COLUMNS + [
        # Also drop any pandas auto-renamed suffix variants that may appear
        c for c in merged_df.columns
        if c.endswith("_x") or c.endswith("_y") or c.endswith(".1")
    ]
    final_df = merged_df.drop(
        columns=[c for c in cols_to_drop if c in merged_df.columns]
    )

    # Drop fully-empty columns that sneak in from the mapping sheet's blank cols
    final_df = final_df.dropna(axis=1, how="all")

    final_df.to_csv(out_path, index=False)
