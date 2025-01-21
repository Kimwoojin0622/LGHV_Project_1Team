import React from "react";
import UserTable from "./UsersTable";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

const theme = createTheme();

const UsersTablePage = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div>
        <h1>User Table</h1>
        <UserTable />
      </div>
    </ThemeProvider>
  );
};

export default UsersTablePage;
