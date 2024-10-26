import { useEffect, useRef, useState } from "react";

//redux
import { useSelector, useDispatch } from "react-redux";
import {
  toggleSearch,
  setLeftSidebarWidth,
  setRightSidebarWidth,
} from "@/redux-toolkit/reducers/Sidebar";

// layouts
import NavBar from "../../Layouts/NavBar";
// import FMTreeSideBar from "../../Layouts/FMTreeSideBar";
import FMMuiTreeSideBar from "../../Layouts/FMMuiTreeSideBar";
import FMMiddlePanel from "../../Layouts/FMMiddlePanel";
import FMRightSideBar from "../../Layouts/FMRightSideBar";

// constant
import { RESIZED_SIDEBAR, PREVENT_SELECT, KEY_DOWN, MOUSE_MOVE, MOUSE_UP, RESIZED_WINDOW } from "@/utils/Constant";
import { EventBus } from "@/utils/Functions";
import { Breadcrumbs } from "@material-tailwind/react";

const MainLyt = () => {
  const dispatch = useDispatch();

  const {
    minWidth,
    maxWidth,
    leftSidebarWidth,
    rightSidebarWidth,
  } = useSelector((state) => state.sidebar);

  const [showLeftSideBar, setShowLeftSideBar] = useState(true);
  const [showRightSideBar, setShowRightSideBar] = useState(true);
  const [showLeftBarOnMobile, setShowLeftBarOnMobile] = useState(false);
  const [showRightBarOnMobile, setShowRightBarOnMobile] = useState(false);
  const isNowLeftResizing = useRef(false);
  const isNowRightResizing = useRef(false);

  useEffect(() => {
    if (window) {
      if (window.innerWidth <= 800) {
        setShowLeftBarOnMobile(false);
        setShowRightBarOnMobile(false);
        setShowLeftSideBar(false);
        setShowRightSideBar(false);
        dispatch(setLeftSidebarWidth(0));
        dispatch(setRightSidebarWidth(0));
      } else {
        setShowLeftBarOnMobile(false);
        setShowRightBarOnMobile(false);
        setShowLeftSideBar(true);
        setShowRightSideBar(true);
        dispatch(setLeftSidebarWidth(250));
        dispatch(setRightSidebarWidth(250));
      }
    }

    function onKeyDown(e) {
      if (e.keyCode === 114 || (e.ctrlKey && e.keyCode === 70)) {
        e.preventDefault();
        dispatch(toggleSearch());
      }
    }
    window.addEventListener(KEY_DOWN, onKeyDown);

    function onMouseMove(e) {
      if (!isNowLeftResizing.current && !isNowRightResizing.current) return;
      EventBus.dispatch(PREVENT_SELECT, true);
      if (isNowLeftResizing.current) {
        // const newWidth = leftSidebarWidth + (e.screenX - leftSidebarWidth);
        const newWidth = e.clientX;

        if (newWidth >= minWidth && newWidth <= maxWidth)
          dispatch(setLeftSidebarWidth(newWidth));
      }
      if (isNowRightResizing.current) {
        const newWidth =
          rightSidebarWidth +
          (this.window.innerWidth - rightSidebarWidth - e.clientX);
        if (newWidth >= minWidth && newWidth <= maxWidth)
          dispatch(setRightSidebarWidth(newWidth));
      }
    }
    window.addEventListener(MOUSE_MOVE, onMouseMove);

    function onMouseUp() {
      isNowLeftResizing.current = false;
      isNowRightResizing.current = false;
      EventBus.dispatch(PREVENT_SELECT, false);
    }
    window.addEventListener(MOUSE_UP, onMouseUp);

    function onResizedWindow() {
      if (window) {
        if (window.innerWidth <= 800) {
          setShowLeftBarOnMobile(false);
          setShowRightBarOnMobile(false);
          setShowLeftSideBar(false);
          setShowRightSideBar(false);
          dispatch(setLeftSidebarWidth(0));
          dispatch(setRightSidebarWidth(0));
        } else {
          setShowLeftBarOnMobile(false);
          setShowRightBarOnMobile(false);
          setShowLeftSideBar(true);
          setShowRightSideBar(true);
          dispatch(setLeftSidebarWidth(250));
          dispatch(setRightSidebarWidth(250));
        }
      }
    }
    window.addEventListener(RESIZED_WINDOW, onResizedWindow);

    return () => {
      window.removeEventListener(KEY_DOWN, onKeyDown);
      window.removeEventListener(MOUSE_MOVE, onMouseMove);
      window.removeEventListener(MOUSE_UP, onMouseUp);
      window.removeEventListener(RESIZED_WINDOW, onResizedWindow);
    };
  }, []);

  useEffect(() => {
    EventBus.dispatch(RESIZED_SIDEBAR, RESIZED_SIDEBAR);
  }, [leftSidebarWidth, rightSidebarWidth]);

  const leftSidebarMouseDown = () => {
    isNowLeftResizing.current = true;
  };

  const rightSidebarMouseDown = () => {
    isNowRightResizing.current = true;
  };

  return (
    <div className="h-full ">
      <NavBar />
      <div className="flex z-20 bg-white justify-between w-full h-[60px] items-center border-b-[#dee0e4] border-b-[1px] top-[82px] fixed">
        <Breadcrumbs
          className={`flex items-center h-5 py-0 my-0 bg-transparent`}
          style={{ marginLeft: `${leftSidebarWidth + 10}px` }}
        >
          <a href="#" className="text-[16px] text-[#757575] font-medium">
            <span>Site</span>
          </a>
          <a href="#" className="text-[16px] text-[#212121] font-medium">
            <span>New Folder</span>
          </a>
        </Breadcrumbs>
      </div>
      <div className="mt-[142px] flex h-full relative">
        <div
          className="fixed  left-0  bg-white h-full"
          style={{
            width:
              showLeftBarOnMobile === true ? `250px` : `${leftSidebarWidth}px`,
            display: `${
              (showLeftSideBar || showLeftBarOnMobile) === true
                ? "flex"
                : "hidden"
            }`,
            zIndex: `${showLeftBarOnMobile === true ? 30 : 20}`,
          }}
        >
          {/* <FMTreeSideBar /> */}
          <FMMuiTreeSideBar
            showOrHide={(showLeftSideBar || showLeftBarOnMobile) === true}
          />
          <div
            className="w-1 border-l-2 cursor-col-resize border-blue-gray-50 "
            onMouseDown={leftSidebarMouseDown}
          ></div>
        </div>
        <div
          style={{
            marginLeft: leftSidebarWidth + "px",
            marginRight: rightSidebarWidth + "px",
            width: `calc(100% - ${
              Number(leftSidebarWidth) + Number(rightSidebarWidth)
            }px)`,
          }}
        >
          <FMMiddlePanel />
        </div>
        <div
          className=" fixed right-0 z-20 bg-white h-full"
          style={{
            width:
              showRightBarOnMobile === true
                ? `250px`
                : `${rightSidebarWidth}px`,
            display: `${
              (showRightSideBar || showRightBarOnMobile) === true
                ? "flex"
                : "hidden"
            }`,
            zIndex: `${showRightBarOnMobile === true ? 30 : 20}`,
          }}
        >
          <div
            className="w-1 border-r-2 cursor-col-resize border-blue-gray-50 h-full"
            onMouseDown={rightSidebarMouseDown}
          ></div>
          <FMRightSideBar />
        </div>
        {leftSidebarWidth === 0 && (
          <div
            className="left-0 top-[50vh] z-50 fixed bg-[#E9F0FD] py-3 pl-3 px-3 rounded-r-full cursor-pointer shadow-md"
            onClick={() => {
              setShowLeftBarOnMobile(!showLeftBarOnMobile);
            }}
          >
            <img
              src="/image/blueRightArrow.svg"
              className="w-10 h-10"
              alt="right arrow"
            />
          </div>
        )}
        {rightSidebarWidth === 0 && (
          <div
            className="right-0 top-[50vh] z-50 fixed  bg-[#E9F0FD] py-3 pr-3 px-3 rounded-l-full cursor-pointer shadow-md"
            onClick={() => setShowRightBarOnMobile(!showRightBarOnMobile)}
          >
            <img
              src="/image/blueLeftArrow.svg"
              className="w-10 h-10"
              alt="right arrow"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default MainLyt;
