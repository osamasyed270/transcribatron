import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  folders: ['Inbox', 'Sent', 'Drafts', 'Trash'],
  emails:[],
};

const emailSlice = createSlice({
  name: "email",
  initialState,
  reducers: {
    setFolders: (state, action) => {
      return { ...state, folders: action.payload };
    },
    setEmails: (state, action) => {
      return { ...state, emails: action.payload };
    },
  },
});

const { reducer, actions } = emailSlice;

export const { setFolders } = actions;
export default reducer;