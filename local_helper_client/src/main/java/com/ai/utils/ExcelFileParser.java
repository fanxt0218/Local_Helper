package com.ai.utils;

import lombok.Builder;
import org.apache.poi.ss.usermodel.*;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;
import java.io.InputStream;
import java.util.*;

@Component
public class ExcelFileParser {

    /**
     * 解析 Excel 文件为结构化数据（支持 xls/xlsx）
     * @param file        上传的 Excel 文件
     * @param headerRow   表头所在行号（从 0 开始）
     * @return List<Map<String, Object>> 每行数据对应一个 Map，键为表头字段名
     */
    public String parse(
            MultipartFile file,
            int headerRow
    ) throws Exception {
        try (InputStream inputStream = file.getInputStream();
             Workbook workbook = WorkbookFactory.create(inputStream)) {

            List<Map<String, Object>> result = new ArrayList<>();
            Sheet sheet = workbook.getSheetAt(0); // 默认解析第一个工作表

            // 提取表头
            Row header = sheet.getRow(headerRow);
            List<String> headers = new ArrayList<>();
            for (Cell cell : header) {
                headers.add(getCellValueAsString(cell));
            }

            // 遍历数据行
            for (int rowIdx = headerRow + 1; rowIdx <= sheet.getLastRowNum(); rowIdx++) {
                Row row = sheet.getRow(rowIdx);
                if (row == null) continue;

                Map<String, Object> rowData = new LinkedHashMap<>();
                for (int colIdx = 0; colIdx < headers.size(); colIdx++) {
                    Cell cell = row.getCell(colIdx, Row.MissingCellPolicy.CREATE_NULL_AS_BLANK);
                    rowData.put(headers.get(colIdx), getCellValue(cell));
                }
                result.add(rowData);
            }
            return result.toString();
        } catch (Exception e) {
            throw new Exception("Excel 解析失败: " + e.getMessage(), e);
        }
    }

    /**
     * 获取单元格值（自动识别类型）
     */
    private static Object getCellValue(Cell cell) {
        CellType cellType = cell.getCellType();
        switch (cellType) {
            case STRING:
                return cell.getStringCellValue().trim();
            case NUMERIC:
                if (DateUtil.isCellDateFormatted(cell)) {
                    return cell.getDateCellValue();
                } else {
                    return cell.getNumericCellValue();
                }
            case BOOLEAN:
                return cell.getBooleanCellValue();
            case FORMULA:
                return evaluateFormulaCell(cell);
            case BLANK:
            default:
                return null;
        }
    }

    /**
     * 处理公式单元格
     */
    private static Object evaluateFormulaCell(Cell cell) {
        try {
            return cell.getCellFormula(); // 返回公式本身
            // 或计算结果：return cell.getNumericCellValue();
        } catch (Exception e) {
            return "公式计算错误";
        }
    }

    /**
     * 获取单元格值（强制转为字符串）
     */
    private static String getCellValueAsString(Cell cell) {
        Object value = getCellValue(cell);
        return (value != null) ? value.toString() : "";
    }
}
