import { StrictMode, useEffect, useState } from "react";
import { useRoutes } from "react-router-dom";
import Routes from "./Routes";
import { Provider } from "react-redux";
import { store } from "@/redux-toolkit/store";

import { Spinner } from "@material-tailwind/react";
import { Toaster } from "react-hot-toast";

import { EventBus } from "./utils/Functions";
import { PREVENT_SELECT, SET_LOADING } from "./utils/Constant";

function App() {
  const pages = useRoutes(Routes);

  const [isLoading, setIsLoading] = useState(false);
  const [isPreventSelect, setIsPreventSelect] = useState(false);

  const setLoading = (data) => {
    setIsLoading(data);
  };

  useEffect(() => {
    function onPreventSelect(flag) {
      setIsPreventSelect(flag)
    }

    function onSetLoading(data) {
      setLoading(data);
      setIsPreventSelect(data);
    }

    EventBus.on(PREVENT_SELECT, onPreventSelect);
    EventBus.on(SET_LOADING, onSetLoading);

    return () => {
      EventBus.remove(PREVENT_SELECT, onPreventSelect);
      EventBus.remove(SET_LOADING, onSetLoading);
    };
  }, [])

  return (
    // <StrictMode>
      <Provider store={store}>
        <div className={`${isPreventSelect ? "select-none" : ""}`}>{pages}</div>
        <div
          style={{
            position: "fixed",
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(255, 255, 255, 0.7)",
            zIndex: 999,
            top: 0,
            left: 0,
            display: `${isLoading ? "flex" : "none"}`,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Spinner color="blue" className="h-10 w-10" />
        </div>
        <Toaster />
      </Provider>
    // </StrictMode>
  );
}

export default App;
