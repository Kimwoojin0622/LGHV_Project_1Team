import React, { useEffect, useState } from "react";
import {
  View,
  Grid,
  Flex,
  Card,
  Placeholder,
  useTheme,
} from "@aws-amplify/ui-react";
import { MdGroup, MdGroupAdd, MdGroupOff } from "react-icons/md";
import TrafficSummary from "./TrafficSummary";
import MiniStatistics from "./MiniStatistics";
import SalesSummary from "./SalesSummary";
import TrafficSources from "./TrafficSources";
import "./Dashboard.css";

interface MonthlySummary {
  month: string;
  total_rows: number;
  churn_y_count: number;
  churn_change: number;
}

const Dashboard = () => {
  const [monthlySummary, setMonthlySummary] = useState<MonthlySummary[]>([]); // 전체 월별 데이터
  const [selectedMonth, setSelectedMonth] = useState<string>(""); // 선택된 월
  const [selectedData, setSelectedData] = useState<MonthlySummary | null>(null); // 선택된 월 데이터
  const [churnSegments, setChurnSegments] = useState<{ segment_name: string; segment_count: number }[]>([]);


  const { tokens } = useTheme();

  // 전체 데이터 가져오기
  useEffect(() => {
    const fetchMonthlySummary = async () => {
      try {
        const response = await fetch("http://127.0.0.1:8000/visualize/monthly-summary");
        const data = await response.json();
        setMonthlySummary(data);

        if (data.length > 0) {
          setSelectedMonth(data[0].month); // 첫 번째 월 기본 선택
        }
      } catch (error) {
        console.error("Error fetching monthly summary:", error);
      }
    };

    fetchMonthlySummary();
  }, []);

  // 선택된 월 데이터 필터링
  useEffect(() => {
    if (selectedMonth) {
      const filteredData = monthlySummary.find((item) => item.month === selectedMonth) || null;
      setSelectedData(filteredData);
      const fetchChurnSegments = async () => {
        try {
          const response = await fetch(`http://127.0.0.1:8000/visualize/churn-segments?month=${selectedMonth}`);
          const segmentData = await response.json();
          setChurnSegments(segmentData); // 데이터 설정
        } catch (error) {
          console.error("Error fetching churn segments:", error);
          setChurnSegments([]); // 에러 시 빈 배열로 설정
        }
      };
  
      fetchChurnSegments();

    }
  }, [selectedMonth, monthlySummary]);

  // 드롭다운 변경 핸들러
  const handleMonthChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMonth(event.target.value);
  };

  if (!selectedData) {
    return <div>Loading...</div>;
  }

  // barChartDataDemo (월별 데이터 유지)
  const barChartData = [
    {
      name: "Total Rows",
      data: monthlySummary.map((item) => item.total_rows),
    },
    {
      name: "Churn",
      data: monthlySummary.map((item) => item.churn_y_count),
    },
  ];

  // lineChartData (월별 churn_y_count)
  const lineChartData = [
    {
      name: "Churn Count",
      data: monthlySummary.map((item) => item.churn_y_count),
    },
  ];

  return (
    <>
      <div>
        <h2>Dashboard</h2>
        {/* 드롭다운 */}
        <select value={selectedMonth} onChange={handleMonthChange}>
          {monthlySummary.map((item) => (
            <option key={item.month} value={item.month}>
              {item.month}
            </option>
          ))}
        </select>
      </div>
      <View borderRadius="6px" maxWidth="100%" padding="0rem" minHeight="100vh">
        <Grid
          templateColumns={{ base: "1fr", large: "1fr 1fr 1fr" }}
          templateRows={{ base: "repeat(6, auto)", large: "repeat(4, auto)" }}
          gap={tokens.space.xl}
        >
          {/* 총 고객 수 */}
          <View columnSpan={1}>
            <MiniStatistics title="총 고객 수" amount={selectedData.total_rows.toLocaleString()} icon={<MdGroup />} />
          </View>
          {/* 해지 고객 */}
          <View columnSpan={1}>
            <MiniStatistics title="해지 고객" amount={selectedData.churn_y_count.toLocaleString()} icon={<MdGroupOff />} />
          </View>
          {/* 전월 대비 */}
          <View columnSpan={1}>
            <MiniStatistics title="전월 대비" amount={selectedData.churn_change.toLocaleString()} icon={<MdGroupAdd />} />
          </View>

          {/* Line Chart (해지 고객 변화) */}
          <View columnSpan={2} rowSpan={2}>
            <Card borderRadius="15px">
              <div className="card-title">해지 고객 변화</div>
              <div className="chart-wrap">
                {lineChartData ? (
                  <div className="row">
                    <SalesSummary
                      title="Churn Change"
                      data={lineChartData}
                      type="line"
                      labels={monthlySummary.map((item) => item.month)}
                    />
                  </div>
                ) : (
                  <Flex direction="column" minHeight="285px">
                    <Placeholder size="small" />
                    <Placeholder size="small" />
                    <Placeholder size="small" />
                    <Placeholder size="small" />
                  </Flex>
                )}
              </div>
            </Card>
          </View>

          {/* 파이차트 (Customer Segments) */}
          <View columnSpan={1} rowSpan={2}>
            <Card height="100%" borderRadius="15px">
              <div className="card-title">해지 고객 분류</div>
              <div className="chart-wrap">
                <TrafficSources
                  title="해지 고객 분류"
                  data={churnSegments.map((segment) => segment.segment_count)}
                  type="donut"
                  labels={churnSegments.map((segment) => segment.segment_name)}
                />
              </div>
            </Card>
          </View>

          {/* Bar Chart (월별 추이) */}
          <View columnSpan={2} rowSpan={2}>
            <Card borderRadius="15px">
              <div className="card-title">월별 추이</div>
              <div className="chart-wrap">
                {barChartData ? (
                  <div className="row">
                    <TrafficSummary
                      title="Monthly Trends"
                      data={barChartData}
                      type="bar"
                      labels={monthlySummary.map((item) => item.month)}
                    />
                  </div>
                ) : (
                  <Flex direction="column" minHeight="285px">
                    <Placeholder size="small" />
                    <Placeholder size="small" />
                    <Placeholder size="small" />
                    <Placeholder size="small" />
                  </Flex>
                )}
              </div>
            </Card>
          </View>

          {/* 신규 고객 */}
          <View columnSpan={1} rowSpan={2}>
            <Card height="100%" borderRadius="15px">
              <div className="card-title">신규 고객</div>
              <div className="chart-wrap">
                <Flex direction="column" minHeight="285px">
                  <Placeholder size="small" />
                  <Placeholder size="small" />
                  <Placeholder size="small" />
                  <Placeholder size="small" />
                </Flex>
              </div>
            </Card>
          </View>
        </Grid>
      </View>
    </>
  );
};



export default Dashboard;
