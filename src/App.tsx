import React, { useState } from "react";
import "./App.css";
import {
  Container,
  Typography,
  TextField,
  Stack,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import Timeline from "./components/Timeline";

// 文件默认范围
const defaultRanges: Record<string, { start: string; end: string }> = {
  "z_han.json": { start: "-256-01-01", end: "-195-12-31" },
  "tang.json": { start: "566-01-01", end: "649-07-10" },
  "song.json": { start: "820-01-01", end: "915-03-19" },
};

// ========== Webpack 动态导入 JSON 数据 ==========
declare const require: {
  context: (
    path: string,
    deep?: boolean,
    filter?: RegExp
  ) => {
    keys: () => string[];
    (key: string): any;
  };
};
const context = require.context("./data", false, /\.json$/);
const fileEntries = context.keys().map((key: string) => {
  const name = key.replace("./", "");
  const data = context(key);
  return { name, data: data.default ?? data };
});

// 类型定义
interface EventItem {
  date: string;
  status: string;
  note?: string;
}
interface Period {
  start: string;
  end: string;
  status: string;
}
interface Person {
  name: string;
  periods: Period[];
  events: EventItem[];
}

const App: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState(fileEntries[0].name);
  const [people, setPeople] = useState<Person[]>(fileEntries[0].data);
  const [start, setStart] = useState(
    defaultRanges[fileEntries[0].name]?.start || "100-01-01"
  );
  const [end, setEnd] = useState(
    defaultRanges[fileEntries[0].name]?.end || "1000-12-31"
  );

  const handleFileChange = (event: any) => {
    const newFile = event.target.value;
    setSelectedFile(newFile);
    const found = fileEntries.find((f) => f.name === newFile);
    if (found) {
      setPeople(found.data);
      const range = defaultRanges[newFile];
      if (range) {
        setStart(range.start);
        setEnd(range.end);
      }
    }
  };

  // 日期验证
  const parseYearMonthDay = (str: string) => {
    const parts = str.split("-");
    let month: number, day: number;

    if (parts[0] === "" && parts.length > 3) {
      month = parseInt(parts[2], 10) || 1;
      day = parseInt(parts[3], 10) || 1;
    } else if (parts[0] === "" && parts.length === 3) {
      month = 1;
      day = 1;
    } else {
      month = parseInt(parts[1], 10) || 1;
      day = parseInt(parts[2], 10) || 1;
    }
    return { month, day };
  };

  const validateDate = (dateStr: string): boolean => {
    try {
      const { month, day } = parseYearMonthDay(dateStr);
      return month >= 1 && month <= 12 && day >= 1 && day <= 31;
    } catch {
      return false;
    }
  };

  const handleStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setStart(value);
    if (!validateDate(value)) {
      console.warn("Invalid start date format");
    }
  };

  const handleEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEnd(value);
    if (!validateDate(value)) {
      console.warn("Invalid end date format");
    }
  };

  return (
    <Container sx={{ paddingTop: 4 }}>
      <Typography variant="h4" align="center" gutterBottom>
        历史人物时间线
      </Typography>

      <Paper sx={{ padding: 2, marginBottom: 3 }} elevation={2}>
        <Stack direction="row" spacing={3} alignItems="center" flexWrap="wrap">
          {/* 文件选择 */}
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>选择数据文件</InputLabel>
            <Select
              value={selectedFile}
              label="选择数据文件"
              onChange={handleFileChange}
            >
              {fileEntries.map((file) => (
                <MenuItem key={file.name} value={file.name}>
                  {file.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* 开始日期 */}
          <TextField
            label="开始日期"
            type="text"
            value={start}
            onChange={handleStartChange}
            InputLabelProps={{ shrink: true }}
            helperText="格式: -200-01-01 (公元前200年1月1日)"
            error={!validateDate(start)}
          />

          {/* 结束日期 */}
          <TextField
            label="结束日期"
            type="text"
            value={end}
            onChange={handleEndChange}
            InputLabelProps={{ shrink: true }}
            helperText="格式: 1220-12-31 (公元1220年12月31日)"
            error={!validateDate(end)}
          />
        </Stack>
      </Paper>

      {/* 时间轴 */}
      <Timeline people={people} start={start} end={end} />
    </Container>
  );
};

export default App;
