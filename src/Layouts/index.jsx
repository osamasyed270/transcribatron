import { useEffect, useRef, useState } from "react";
import { Outlet } from "react-router-dom";
import VideoMainBody from "../MyComponents/VideoMainBody"

//redux
import { useSelector, useDispatch } from "react-redux";
import { togglePlaylist, toggleNote, toggleSearch, setLeftSidebarWidth, setRightSidebarWidth, initSidebar } from "@/redux-toolkit/reducers/Sidebar";

// layouts
import NavBar from "./NavBar";
import NoteSideBar from "./NoteSideBar";
import PlaylistSideBar from "./PlaylistSideBar";
import SearchSideBar from "./SearchSideBar";

// components
import TMediaController from "@/Components/TMediaController";

// constant
import { DEBUG_MODE, SET_LOADING, NOTE_SIDEBAR, PLAYLIST_SIDEBAR, RESIZED_SIDEBAR, SEARCH_SIDEBAR, PREVENT_SELECT, KEY_DOWN, MOUSE_MOVE, MOUSE_UP } from "@/utils/Constant";
import { EventBus } from "@/utils/Functions";
import EmailAdminService from "@/services/emailAdmin";
import { toast } from "react-hot-toast";

const MainLyt = () => {
  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.admin.currentUser);

  const { minWidth, maxWidth, defaultWidth, playlistOrder, noteOrder, searchOrder, leftSidebarWidth, rightSidebarWidth } = useSelector((state) => state.sidebar);
  const isNowLeftResizing = useRef(false);
  const isNowRightResizing = useRef(false);
  const [mailboxLoaded, setMailboxLoaded] = useState(false);

  useEffect(() => {
    console.log("ADMIN FETCH USER");
    EmailAdminService.getUserById("otakar@deskvantage.com")
            .then((res) => {
                if (res.status === 200) {
                  console.log("CURRENT USER: ", res.data);
                  dispatch({type: 'admin/setCurrentUser', payload: res.data});
                } else {
                    toast.error("There's no mailbox registered for user!");
                }
                setMailboxLoaded(true);
                EventBus.dispatch(SET_LOADING, false);
            })
            .catch((err) => {
                toast.error("An error has occurred while fetching mailbox!");
                if (DEBUG_MODE) console.log(err);
                EventBus.dispatch(SET_LOADING, false);
                setMailboxLoaded(true);
            });

  }, [mailboxLoaded]);

  useEffect(() => {
    dispatch(initSidebar());

    function onKeyDown(e) {
      if (e.keyCode === 114 || (e.ctrlKey && e.keyCode === 70)) {
        e.preventDefault();
        dispatch(toggleSearch())
      }
    }
    window.addEventListener(KEY_DOWN, onKeyDown);
    
    function onMouseMove(e) {
      if (!isNowLeftResizing.current && !isNowRightResizing.current) return;
      EventBus.dispatch(PREVENT_SELECT, true);
      if (isNowLeftResizing.current) {
        const newWidth = leftSidebarWidth + (e.screenX - leftSidebarWidth);
        if (newWidth >= minWidth && newWidth <= maxWidth)
          dispatch(setLeftSidebarWidth(newWidth));
      }
      if (isNowRightResizing.current) {
        const newWidth = rightSidebarWidth + ((this.window.innerWidth - rightSidebarWidth) - e.screenX);
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

    return () => {
      window.removeEventListener(KEY_DOWN, onKeyDown);
      window.removeEventListener(MOUSE_MOVE, onMouseMove);
      window.removeEventListener(MOUSE_UP, onMouseUp);
    };
  }, [])

  const getLeftSidebar = () => {
    return playlistOrder > noteOrder ? playlistOrder > searchOrder ? PLAYLIST_SIDEBAR : SEARCH_SIDEBAR : noteOrder > searchOrder ? NOTE_SIDEBAR : SEARCH_SIDEBAR;
  }

  const getRightSidebar = () => {
    return playlistOrder < noteOrder ? playlistOrder < searchOrder ? PLAYLIST_SIDEBAR : SEARCH_SIDEBAR : noteOrder < searchOrder ? NOTE_SIDEBAR : SEARCH_SIDEBAR;
  }

  useEffect(() => {
    EventBus.dispatch(RESIZED_SIDEBAR, RESIZED_SIDEBAR);
  }, [leftSidebarWidth, rightSidebarWidth])

  const leftSidebarMouseDown = (e) => {
    isNowLeftResizing.current = true;
  }

  const rightSidebarMouseDown = (e) => {
    isNowRightResizing.current = true;
  }

  return (
    <>
      <NavBar />

      <div className="flex mt-[82px] mb-[102px]">
        {(playlistOrder > 1 || noteOrder > 1 || searchOrder > 1) && (
          <div className="flex fixed z-40 bg-white">
            <div style={{width: leftSidebarWidth}}>
              <div className={`${getLeftSidebar() === PLAYLIST_SIDEBAR ? "" : "hidden"}`}><PlaylistSideBar close={() => dispatch(togglePlaylist())} /></div>
              <div className={`${getLeftSidebar() === NOTE_SIDEBAR ? "" : "hidden"}`}><NoteSideBar close={() => dispatch(toggleNote())} /></div>
              <div className={`${getLeftSidebar() === SEARCH_SIDEBAR ? "" : "hidden"}`}><SearchSideBar close={() => dispatch(toggleSearch())} /></div>
            </div>
            <div className="w-1 border-l-2 cursor-col-resize border-blue-gray-50" onMouseDown={leftSidebarMouseDown}></div>
          </div>
        )}
        <div style={{marginLeft: leftSidebarWidth + "px", marginRight: rightSidebarWidth + "px"}}>
          {/* <Outlet /> */}
          <VideoMainBody />
        </div>
        {(playlistOrder < -1 || noteOrder < -1 || searchOrder < -1) && (
          <div className="flex fixed right-0 z-40 bg-white">
            <div className="w-1 border-r-2 cursor-col-resize border-blue-gray-50" onMouseDown={rightSidebarMouseDown}></div>
            <div style={{width: rightSidebarWidth}}>
              <div className={`${getRightSidebar() === PLAYLIST_SIDEBAR ? "" : "hidden"}`}><PlaylistSideBar close={() => dispatch(togglePlaylist())} /></div>
              <div className={`${getRightSidebar() === NOTE_SIDEBAR ? "" : "hidden"}`}><NoteSideBar close={() => dispatch(toggleNote())} /></div>
              <div className={`${getRightSidebar() === SEARCH_SIDEBAR ? "" : "hidden"}`}><SearchSideBar close={() => dispatch(toggleSearch())} /></div>
            </div>
          </div>
        )}
      </div>

      <TMediaController />
    </>
  );
};

export default MainLyt;