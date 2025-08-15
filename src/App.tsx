import React, { useState, useEffect } from "react";
import data from "./data.json";
import "./App.css";

// MUI 组件
import { Container, Typography, TextField, Stack, Paper } from "@mui/material";

const startDate = "611-01-01";
const endDate = "627-12-31";

interface EventItem {
  date: string; // YYYY-MM-DD
  status: string;
  note?: string;
}

interface Period {
  start: string; // YYYY-MM-DD
  end: string; // YYYY-MM-DD
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

const toTime = (dateStr: string) => new Date(dateStr).getTime();

const getPosition = (dateStr: string, rangeStart: number, rangeEnd: number) => {
  const time = toTime(dateStr);
  return ((time - rangeStart) / (rangeEnd - rangeStart)) * 100;
};

const getWidth = (
  startStr: string,
  endStr: string,
  rangeStart: number,
  rangeEnd: number
) => {
  const start = Math.max(toTime(startStr), rangeStart);
  const end = Math.min(toTime(endStr), rangeEnd);
  return ((end - start) / (rangeEnd - rangeStart)) * 100;
};

interface TimelineProps {
  people: Person[];
  start: string;
  end: string;
}

const Timeline: React.FC<TimelineProps> = ({ people, start, end }) => {
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);

  const rangeStart = toTime(start);
  const rangeEnd = toTime(end);

  const startYear = new Date(start).getFullYear();
  const endYear = new Date(end).getFullYear();
  const yearsArr: string[] = [];
  for (let y = startYear; y <= endYear; y += 5) {
    yearsArr.push(`${y}-01-01`);
  }

  return (
    <div className="timeline-container">
      <div className="year-line">
        {yearsArr.map((yStr) => (
          <div
            key={yStr}
            className="year-tick"
            style={{ left: `${getPosition(yStr, rangeStart, rangeEnd)}%` }}
          >
            {new Date(yStr).getFullYear()}
          </div>
        ))}
      </div>

      {/* 人物行 */}
      <div className="people-lines">
        {people.map((person) => (
          <div className="person-line" key={person.name}>
            <div className="person-name">{person.name}</div>
            <div className="events-bar">
              {/* 状态条段 */}
              {person.periods
                .filter(
                  (p) =>
                    toTime(p.end) >= rangeStart && toTime(p.start) <= rangeEnd
                )
                .map((p, idx) => {
                  const blockStartStr =
                    toTime(p.start) < rangeStart ? start : p.start;
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

              {/* 离散事件点 */}
              {person.events
                .filter(
                  (e) =>
                    toTime(e.date) >= rangeStart && toTime(e.date) <= rangeEnd
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

      {hoverInfo && (
        <div className="tooltip">
          <strong>{hoverInfo.name}</strong>
          <br />
          {hoverInfo.date
            ? `${hoverInfo.date} - ${hoverInfo.status}`
            : `${hoverInfo.start} ~ ${hoverInfo.end} - ${hoverInfo.status}`}
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
  const [people, setPeople] = useState<Person[]>([]);
  const [start, setStart] = useState(startDate);
  const [end, setEnd] = useState(endDate);

  useEffect(() => {
    setPeople(data as unknown as Person[]);
  }, []);

  return (
    <Container sx={{ paddingTop: 4 }}>
      <Typography variant="h4" align="center" gutterBottom>
        历史人物时间线
      </Typography>

      {/* 输入框部分 */}
      <Paper sx={{ padding: 2, marginBottom: 3, marginX: 3 }} elevation={2}>
        <Stack direction="row" spacing={3}>
          <TextField
            label="开始日期"
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            InputLabelProps={{
              shrink: true,
            }}
          />
          <TextField
            label="结束日期"
            type="date"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            InputLabelProps={{
              shrink: true,
            }}
          />
        </Stack>
      </Paper>

      <Timeline people={people} start={start} end={end} />
    </Container>
  );
};

export default App;
