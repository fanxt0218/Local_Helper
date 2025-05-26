package com.ai.utils;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.ss.util.CellReference;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.apache.poi.hssf.usermodel.HSSFWorkbook;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.HashSet;
import java.util.Set;

public class ExcelFileParser {

    public String parse(MultipartFile file) throws Exception {
        StringBuilder output = new StringBuilder();
        DataFormatter dataFormatter = new DataFormatter();

        try (InputStream is = file.getInputStream();
             // 根据文件扩展名自动选择Workbook实现
             Workbook workbook = file.getOriginalFilename().endsWith(".xlsx") ?
                     new XSSFWorkbook(is) : new HSSFWorkbook(is)) {

            for (Sheet sheet : workbook) {
                Set<CellRangeAddress> mergedRegions = new HashSet<>(sheet.getMergedRegions());

                for (Row row : sheet) {
                    output.append("\nRow ").append(row.getRowNum() + 1).append(":\n");

                    for (Cell cell : row) {
                        boolean isMerged = mergedRegions.stream()
                                .anyMatch(region -> region.isInRange(cell.getRowIndex(), cell.getColumnIndex()));

                        String cellAddress = getCellAddress(cell);
                        String cellValue = formatCellValue(dataFormatter, cell);

                        output.append("  ")
                                .append(String.format("%-5s", cellAddress))  // 固定宽度对齐
                                .append(isMerged ? "(M) " : "    ")
                                .append(": ")
                                .append(cellValue)
                                .append(" [")
                                .append(getCellTypeName(cell))
                                .append("]\n");
                    }
                }
            }
        }
        return output.toString().trim();
    }

    private static String formatCellValue(DataFormatter formatter, Cell cell) {
        String value = formatter.formatCellValue(cell);
        if (value.isEmpty()) return "[空]";

        // 特殊处理布尔值显示
        if (cell.getCellType() == CellType.BOOLEAN) {
            return Boolean.valueOf(value).toString().toUpperCase();
        }
        return value;
    }

    private static String getCellAddress(Cell cell) {
        return CellReference.convertNumToColString(cell.getColumnIndex()) + (cell.getRowIndex() + 1);
    }

    private static String getCellTypeName(Cell cell) {
        // 优先处理公式类型
        if (cell.getCellType() == CellType.FORMULA) {
            CellType resultType = cell.getCachedFormulaResultType();
            return "FORMULA(" + getBaseCellTypeName(resultType) + ")";
        }
        return getBaseCellTypeName(cell.getCellType());
    }

    // 基础类型名称转换
    private static String getBaseCellTypeName(CellType cellType) {
        switch (cellType) {
            case STRING:  return "TEXT";
            case NUMERIC: return "NUMBER";
            case BOOLEAN: return "BOOL";
            case BLANK:   return "BLANK";
            default:      return "OTHER";
        }
    }
}