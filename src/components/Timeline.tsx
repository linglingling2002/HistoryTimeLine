import React, { useState } from "react";

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

// ======== 工具函数 ======== //
function parseYearMonthDay(str: string) {
  if (!str || typeof str !== "string") {
    return { year: 0, month: 1, day: 1 };
  }
  const parts = str.split("-");
  let year: number, month: number, day: number;

  if (parts[0] === "" && parts.length > 3) {
    year = -parseInt(parts[1], 10);
    month = parseInt(parts[2], 10) || 1;
    day = parseInt(parts[3], 10) || 1;
  } else if (parts[0] === "" && parts.length === 3) {
    year = -parseInt(parts[1], 10);
    month = 1;
    day = 1;
  } else {
    year = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10) || 1;
    day = parseInt(parts[2], 10) || 1;
  }

  return { year, month, day };
}

function isLeapYear(year: number): boolean {
  if (year <= 0) {
    const absYear = Math.abs(year - 1);
    return absYear % 4 === 0;
  }
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function formatYear(year: number): string {
  if (year <= 0) {
    return `-${Math.abs(year - 1)}年`;
  }
  return `${year}年`;
}

function toDayNumber(str: string): number {
  const { year, month, day } = parseYearMonthDay(str);
  let totalDays = 0;

  if (year > 0) {
    totalDays += (year - 1) * 365;
    totalDays += Math.floor((year - 1) / 4);
  } else {
    const absYear = Math.abs(year);
    totalDays -= absYear * 365;
    totalDays -= Math.floor(absYear / 4);
  }

  const daysInMonth = [30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30];
  for (let i = 0; i < month - 1; i++) {
    totalDays += daysInMonth[i];
  }

  if (month > 2 && isLeapYear(year)) {
    totalDays += 1;
  }

  totalDays += day - 1;
  return totalDays;
}

const getPosition = (dateStr: string, rangeStart: number, rangeEnd: number) => {
  const day = toDayNumber(dateStr);
  return ((day - rangeStart) / (rangeEnd - rangeStart)) * 100;
};

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

function formatDateDisplay(dateStr: string): string {
  const { year, month, day } = parseYearMonthDay(dateStr);
  const yearStr = year <= 0 ? `-${Math.abs(year - 1)}年` : `${year}年`;
  return `${yearStr}${month}月${day}日`;
}

// ======== Timeline 组件 ======== //
const Timeline: React.FC<TimelineProps> = ({ people, start, end }) => {
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);
  const [tooltipOnLeft, setTooltipOnLeft] = useState(false); // 是否左下角

  const rangeStart = toDayNumber(start);
  const rangeEnd = toDayNumber(end);

  const startYear = parseYearMonthDay(start).year;
  const endYear = parseYearMonthDay(end).year;

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

  // 鼠标进入时，设置提示信息和位置
  const handleMouseEnter = (
    info: HoverInfo,
    e: React.MouseEvent<HTMLDivElement, MouseEvent>
  ) => {
    const isRightHalf = e.clientX > window.innerWidth / 2;
    setTooltipOnLeft(isRightHalf); // 如果鼠标在右半屏，把tooltip移左下角
    setHoverInfo(info);
  };

  return (
    <div className="timeline-container">
      {/* 年份刻度 */}
      <div className="year-line">
        {yearsArr.map((year) => {
          const yearDateStr = `${year}-01-01`;
          const position = getPosition(yearDateStr, rangeStart, rangeEnd);
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
                      onMouseEnter={(e) =>
                        handleMouseEnter(
                          {
                            name: person.name,
                            status: p.status,
                            start: p.start,
                            end: p.end,
                          },
                          e
                        )
                      }
                      onMouseLeave={() => setHoverInfo(null)}
                    />
                  );
                })}

              {person.events
                .filter(
                  (ev) =>
                    toDayNumber(ev.date) >= rangeStart &&
                    toDayNumber(ev.date) <= rangeEnd
                )
                .map((ev, idx) => (
                  <div
                    key={`event-${idx}`}
                    className="event-point"
                    style={{
                      left: `${getPosition(ev.date, rangeStart, rangeEnd)}%`,
                    }}
                    onMouseEnter={(e) =>
                      handleMouseEnter(
                        {
                          name: person.name,
                          status: ev.status,
                          date: ev.date,
                          note: ev.note,
                        },
                        e
                      )
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
        <div
          className={`tooltip ${
            tooltipOnLeft ? "tooltip-left" : "tooltip-right"
          }`}
        >
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
export default Timeline;
