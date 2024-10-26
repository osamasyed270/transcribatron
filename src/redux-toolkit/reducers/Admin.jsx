import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  currentUser: {
    folders: []
  },
};

const adminSlice = createSlice({
  name: "admin",
  initialState,
  reducers: {
    setCurrentUser: (state = initialState, action) => {
    console.log("REDUCER setCurrentUser:", state, action);
      switch (action.type) {
          case 'admin/setCurrentUser':
            return {
              ...state,
              currentUser: action.payload
            };
          default:
            return state;
      }
    },
    addFolder: (state, action) => {
      console.log("REDUCER addFolder:", state, action);
      return {
        ...state,
        currentUser: {
          ...state.currentUser,
          folders: [...state.currentUser.folders, action.payload]
        }
      };
    },
    removeFolder: (state, action) => {
      console.log("REDUCER removeFolder:", state, action);
      return {
        ...state,
        currentUser: {
          ...state.currentUser,
          folders: state.currentUser.folders.toSpliced(state.currentUser.folders.indexOf(action.payload),1)
        }
      };
    }
  }
});

const { reducer, actions } = adminSlice;

export const { setCurrentUser, amendCurrentUser } = actions;
export default reducer;