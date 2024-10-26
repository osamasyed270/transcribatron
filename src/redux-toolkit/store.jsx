import { configureStore } from "@reduxjs/toolkit";
import mediaReducer from "./reducers/Media";
import SidebarReducer from "./reducers/Sidebar";
import EditorReducer from "./reducers/Editor";
import EmailReducer from "./reducers/Email";
import AdminReducer from "./reducers/Admin";

const reducer = {
  media: mediaReducer,
  sidebar: SidebarReducer,
  email: EmailReducer,
  admin: AdminReducer,
  editor: EditorReducer
};

export const store = configureStore({
  reducer: reducer,
  devTools: true,
});
