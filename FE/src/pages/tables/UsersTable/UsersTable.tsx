import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Button,
  TextField,
  Select,
  MenuItem,
} from "@mui/material";

// 사용자 타입 정의
interface User {
  sha2_hash: string;
  p_mt: string;
  SCRB_PATH_NM_GRP: string;
  INHOME_RATE: string;
  TOTAL_USED_DAYS: number;
}

const UserTable = () => {
  const [users, setUsers] = useState<User[]>([]); // 사용자 데이터 상태
  const [selectedSCRBPath, setSelectedSCRBPath] = useState(""); // 필터 상태
  const [searchID, setSearchID] = useState(""); // ID 검색 상태
  const [filteredUser, setFilteredUser] = useState<User | null>(null); // 검색된 사용자 데이터

  // 사용자 목록 가져오기
  const fetchUsers = async () => {
    try {
      const url = selectedSCRBPath
        ? `http://127.0.0.1:8000/api/users/?scrb_path=${selectedSCRBPath}`
        : "http://127.0.0.1:8000/api/users/";
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch users");
      const data = await response.json();
      setUsers(data); // 사용자 데이터 업데이트
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  // 특정 ID로 사용자 검색
  const fetchUserByID = async () => {
    if (!searchID) return;
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/users/${searchID}`);
      if (!response.ok) throw new Error("Failed to fetch user by ID");
      const data = await response.json();
      setFilteredUser(data); // 검색된 사용자 데이터 설정
    } catch (error) {
      console.error("Error fetching user by ID:", error);
    }
  };

  // 선택된 SCRB Path 필터가 변경될 때 사용자 목록 업데이트
  useEffect(() => {
    fetchUsers();
  }, [selectedSCRBPath]);

  return (
    <div>
      <h2>User Table</h2>

      {/* SCRB Path 필터 */}
      <div style={{ marginBottom: "20px" }}>
        <Select
          value={selectedSCRBPath}
          onChange={(e) => setSelectedSCRBPath(e.target.value)}
          displayEmpty
        >
          <MenuItem value="">All</MenuItem>
          <MenuItem value="현장경로">현장경로</MenuItem>
          <MenuItem value="온라인경로">온라인경로</MenuItem>
          <MenuItem value="기타">기타</MenuItem>
        </Select>
      </div>

      {/* ID 검색 */}
      <div style={{ marginBottom: "20px" }}>
        <TextField
          label="Search by ID"
          value={searchID}
          onChange={(e) => setSearchID(e.target.value)}
          style={{ marginRight: "10px" }}
        />
        <Button variant="contained" onClick={fetchUserByID}>
          Search
        </Button>
      </div>

      {/* 검색된 사용자 정보 표시 */}
      {filteredUser && (
        <div style={{ marginBottom: "20px" }}>
          <h3>Search Result</h3>
          <p>ID: {filteredUser.sha2_hash}</p>
          <p>Month: {filteredUser.p_mt}</p>
          <p>SCRB Path: {filteredUser.SCRB_PATH_NM_GRP}</p>
          <p>Inhome Rate: {filteredUser.INHOME_RATE}</p>
          <p>Total Used Days: {filteredUser.TOTAL_USED_DAYS}</p>
        </div>
      )}

      {/* 사용자 테이블 */}
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>Month</TableCell>
            <TableCell>SCRB Path</TableCell>
            <TableCell>Inhome Rate</TableCell>
            <TableCell>Total Used Days</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.sha2_hash}>
              <TableCell>{user.sha2_hash}</TableCell>
              <TableCell>{user.p_mt}</TableCell>
              <TableCell>{user.SCRB_PATH_NM_GRP}</TableCell>
              <TableCell>{user.INHOME_RATE}</TableCell>
              <TableCell>{user.TOTAL_USED_DAYS}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default UserTable;
