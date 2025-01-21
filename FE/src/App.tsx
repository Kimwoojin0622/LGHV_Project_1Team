import React from "react";
import { Routes, Route, Link } from "react-router-dom";
import { ThemeProvider as MuiThemeProvider, createTheme } from "@mui/material/styles";
import { ThemeProvider as AmplifyThemeProvider } from "@aws-amplify/ui-react";
import CssBaseline from "@mui/material/CssBaseline";
import "@aws-amplify/ui-react/styles.css";
import "./App.css";

import Layout from "./components/Layout";
import Dashboard from "./pages/dashboard";
import Profile from "./pages/profile";
import Tables from "./pages/tables";
import UsersTable from "./pages/tables/UsersTablePage";
import Forms from "./pages/forms";
import EditForm from "./pages/forms/EditForm";

// MUI 테마 생성
const muiTheme = createTheme();

export default function App() {
  return (
    <AmplifyThemeProvider>
      <MuiThemeProvider theme={muiTheme}>
        <CssBaseline /> {/* MUI 기본 스타일 리셋 */}
        <div>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="forms" element={<Forms />} />
              <Route path="edit-form" element={<EditForm />} />
              <Route path="tables" element={<Tables />} />
              <Route path="users-table" element={<UsersTable />} />
              <Route path="profile" element={<Profile />} />
              <Route path="*" element={<NoMatch />} /> {/* Catch-all route */}
            </Route>
          </Routes>
        </div>
      </MuiThemeProvider>
    </AmplifyThemeProvider>
  );
}

function NoMatch() {
  return (
    <div>
      <h2>Nothing to see here!</h2>
      <p>
        <Link to="/">Go to the home page</Link>
      </p>
    </div>
  );
}
