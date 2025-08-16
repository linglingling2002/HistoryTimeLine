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

// 每个文件的默认时间范围
const defaultRanges: Record<string, { start: string; end: string }> = {
  "han.json": { start: "-256-01-01", end: "-195-12-31" },
  "tang.json": { start: "566-01-01", end: "649-07-10" },
  "song.json": { start: "875-01-01", end: "895-03-19" },
};

// ========== 支持公元前年份的日期解析函数 ==========
function parseYearMonthDay(str: string) {
  if (!str || typeof str !== "string") {
    return { year: 0, month: 1, day: 1 };
  }

  const parts = str.split("-");
  let year: number, month: number, day: number;

  if (parts[0] === "" && parts.length > 3) {
    // 处理负数年份，如 "-232-01-01" 会被分割为 ["", "232", "01", "01"]
    year = -parseInt(parts[1], 10);
    month = parseInt(parts[2], 10) || 1;
    day = parseInt(parts[3], 10) || 1;
  } else if (parts[0] === "" && parts.length === 3) {
    // 处理如 "-232"
    year = -parseInt(parts[1], 10);
    month = 1;
    day = 1;
  } else {
    // 正数年份
    year = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10) || 1;
    day = parseInt(parts[2], 10) || 1;
  }

  return { year, month, day };
}

// 简单的闰年判断
function isLeapYear(year: number): boolean {
  if (year <= 0) {
    // 公元前的闰年计算稍有不同，这里简化处理
    const absYear = Math.abs(year - 1); // 公元前1年实际是0年
    return absYear % 4 === 0;
  }
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

// 年份显示函数
function formatYear(year: number): string {
  if (year <= 0) {
    return `-${Math.abs(year - 1)}年`; // 公元前1年实际是公元前1年
  }
  return `${year}年`;
}

// 日期转换函数
function toDayNumber(str: string): number {
  const { year, month, day } = parseYearMonthDay(str);

  // 基准点设为公元1年1月1日 = 0
  let totalDays = 0;

  // 计算年份贡献的天数
  if (year > 0) {
    // 公元后
    totalDays += (year - 1) * 365;
    // 简单的闰年计算（每4年一个闰年，不考虑100年和400年规则）
    totalDays += Math.floor((year - 1) / 4);
  } else {
    // 公元前
    const absYear = Math.abs(year);
    totalDays -= absYear * 365;
    totalDays -= Math.floor(absYear / 4);
  }

  // 计算月份贡献的天数（按农历）
  const daysInMonth = [30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30];
  for (let i = 0; i < month - 1; i++) {
    totalDays += daysInMonth[i];
  }

  // 如果是闰年且月份大于2月，多加一天
  if (month > 2 && isLeapYear(year)) {
    totalDays += 1;
  }

  // 加上日期
  totalDays += day - 1;

  return totalDays;
}

// 获取位置百分比
const getPosition = (dateStr: string, rangeStart: number, rangeEnd: number) => {
  const day = toDayNumber(dateStr);
  return ((day - rangeStart) / (rangeEnd - rangeStart)) * 100;
};

// 获取宽度百分比
const getWidth = (
  startStr: string,
  endStr: string,
  rangeStart: number,
  rangeEnd: number
) => {
  const start = Math.max(toDayNumber(startStr), rangeStart);
  const end = Math.min(toDayNumber(endStr), rangeEnd);
  return ((end - start) / (rangeEnd - rangeStart)) * 100;
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

interface HoverInfo {
  name: string;
  status: string;
  date?: string;
  note?: string;
  start?: string;
  end?: string;
}

interface TimelineProps {
  people: Person[];
  start: string;
  end: string;
}

// 格式化日期显示
function formatDateDisplay(dateStr: string): string {
  const { year, month, day } = parseYearMonthDay(dateStr);
  const yearStr = year <= 0 ? `-${Math.abs(year - 1)}年` : `${year}年`;
  return `${yearStr}${month}月${day}日`;
}

const Timeline: React.FC<TimelineProps> = ({ people, start, end }) => {
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);

  const rangeStart = toDayNumber(start);
  const rangeEnd = toDayNumber(end);

  const startYear = parseYearMonthDay(start).year;
  const endYear = parseYearMonthDay(end).year;

  // 年份刻度生成
  const generateYearTicks = (startY: number, endY: number): number[] => {
    const years: number[] = [];
    const span = endY - startY;

    let step = 1;
    if (span > 100) step = 10;
    else if (span > 50) step = 5;
    else if (span > 20) step = 2;

    for (let y = Math.ceil(startY / step) * step; y <= endY; y += step) {
      years.push(y);
    }

    return years;
  };

  const yearsArr = generateYearTicks(startYear, endYear);

  return (
    <div className="timeline-container">
      {/* 年份刻度线 */}
      <div className="year-line">
        {yearsArr.map((year) => {
          const yearDateStr = `${year}-01-01`;
          const position = getPosition(yearDateStr, rangeStart, rangeEnd);

          // 只显示在可视范围内的年份标签
          if (position >= 0 && position <= 100) {
            return (
              <div
                key={year}
                className="year-tick"
                style={{ left: `${position}%` }}
              >
                {formatYear(year)}
              </div>
            );
          }
          return null;
        })}
      </div>

      {/* 人物行 */}
      <div className="people-lines">
        {people.map((person) => (
          <div className="person-line" key={person.name}>
            <div className="person-name">{person.name}</div>
            <div className="events-bar">
              {/* 时期块 */}
              {person.periods
                .filter(
                  (p) =>
                    toDayNumber(p.end) >= rangeStart &&
                    toDayNumber(p.start) <= rangeEnd
                )
                .map((p, idx) => {
                  const blockStartStr =
                    toDayNumber(p.start) < rangeStart ? start : p.start;
                  return (
                    <div
                      key={`period-${idx}`}
                      className="period-block"
                      style={{
                        left: `${getPosition(
                          blockStartStr,
                          rangeStart,
                          rangeEnd
                        )}%`,
                        width: `${getWidth(
                          p.start,
                          p.end,
                          rangeStart,
                          rangeEnd
                        )}%`,
                      }}
                      onMouseEnter={() =>
                        setHoverInfo({
                          name: person.name,
                          status: p.status,
                          start: p.start,
                          end: p.end,
                        })
                      }
                      onMouseLeave={() => setHoverInfo(null)}
                    />
                  );
                })}

              {/* 事件点 */}
              {person.events
                .filter(
                  (e) =>
                    toDayNumber(e.date) >= rangeStart &&
                    toDayNumber(e.date) <= rangeEnd
                )
                .map((e, idx) => (
                  <div
                    key={`event-${idx}`}
                    className="event-point"
                    style={{
                      left: `${getPosition(e.date, rangeStart, rangeEnd)}%`,
                    }}
                    onMouseEnter={() =>
                      setHoverInfo({
                        name: person.name,
                        status: e.status,
                        date: e.date,
                        note: e.note,
                      })
                    }
                    onMouseLeave={() => setHoverInfo(null)}
                  />
                ))}
            </div>
          </div>
        ))}
      </div>

      {/* 提示框 */}
      {hoverInfo && (
        <div className="tooltip">
          <strong>{hoverInfo.name}</strong>
          <br />
          {hoverInfo.date
            ? `${formatDateDisplay(hoverInfo.date)} - ${hoverInfo.status}`
            : `${formatDateDisplay(hoverInfo.start!)} ~ ${formatDateDisplay(
                hoverInfo.end!
              )} - ${hoverInfo.status}`}
          {hoverInfo.note && (
            <div>
              <em>{hoverInfo.note}</em>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState(fileEntries[0].name);
  const [people, setPeople] = useState<Person[]>(fileEntries[0].data);
  const [start, setStart] = useState(
    defaultRanges[fileEntries[0].name]?.start || "850-01-01"
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

  // 日期验证函数
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
