import { useEffect, useRef, useState } from "react";

// redux
import { useSelector, useDispatch } from "react-redux";
import { setCurrentTime, setIsPlaying, setMedias, setSelectedMediaId } from "@/redux-toolkit/reducers/Media";

// components
import TEditor from "@/Components/TEditor";

// Toast
import { toast } from "react-hot-toast";

// utils
import { MEDIA_TYPE_VIDEO, MEDIA_TYPE_AUDIO, RESIZED_WINDOW, RESIZED_SIDEBAR, RESIZED_FUNCTION_BAR, TIME_UPDATE_OUTSIDE, MEDIA_TIME_UPDATE, SET_LOADING } from "@/utils/Constant";
import { EventBus, getItemFromArr } from "@/utils/Functions";

// services
import MediaService from "@/services/media";

const Home = () => {
  const dispatch = useDispatch();
  const videoRef = useRef();
  const audioRef = useRef();
  const editorRef = useRef();
  const isUpdatedFromOutside = useRef(false);

  const { selectedMediaId, showMedia, mediaSide, medias, isPlaying, frameSpeed, volume, autoPlay } = useSelector((state) => state.media);

  const [videoWidth, setVideoWidth] = useState(0);

  const handleResize = () => {
    let videoTagWidth = videoRef.current?.clientWidth == undefined ? 0 : videoRef.current.clientWidth;
    let editorWidth = editorRef.current?.clientWidth == undefined ? 0 : editorRef.current.clientWidth;
    setVideoWidth(videoTagWidth);
    EventBus.dispatch(RESIZED_FUNCTION_BAR, editorWidth == 80 ? 0 : editorWidth);
  }

  useEffect(() => {
    EventBus.dispatch(SET_LOADING, true);
    MediaService.getAllMedias()
      .then((res) => {
        if (res.status == 200) {
          dispatch(setMedias(res.data.data))
          dispatch(setSelectedMediaId(res.data.data[0].fileId));
        } else {
          toast.error("Sorry, but an error has been ocurred while getting media list!");
        }
        EventBus.dispatch(SET_LOADING, false);
      })
      .catch((err) => {
        toast.error("Sorry, but an error has been ocurred while getting media list!");
        EventBus.dispatch(SET_LOADING, false);
      });
  }, [])

  // handle event
  useEffect(() => {

    // Listener to trigger sidebar resize event
    EventBus.on(RESIZED_SIDEBAR, handleResize);

    // Attach the event listener to the window object
    window.addEventListener(RESIZED_WINDOW, handleResize);

    // handle video/audio timeupdate event
    function onVideoTimeUpdate() {
      if (!isUpdatedFromOutside.current) {
        let time = videoRef.current.currentTime == 0 ? 0.000001 : videoRef.current.currentTime
        if (time == videoRef.current.duration) {
          dispatch(setCurrentTime(0.000001))
          dispatch(setIsPlaying(false));
          return;
        }
        dispatch(setCurrentTime(time));
      } else {
        isUpdatedFromOutside.current = false;
      }
    }
    videoRef.current.addEventListener(MEDIA_TIME_UPDATE, onVideoTimeUpdate);

    function onAudioTimeUpdate() {
      if (!isUpdatedFromOutside.current) {
        let time = audioRef.current.currentTime == 0 ? 0.000001 : audioRef.current.currentTime
        if (time == audioRef.current.duration) {
          dispatch(setCurrentTime(0.000001))
          dispatch(setIsPlaying(false));
          return;
        }
        dispatch(setCurrentTime(time));
      } else {
        isUpdatedFromOutside.current = false;
      }
    }
    audioRef.current.addEventListener(MEDIA_TIME_UPDATE, onAudioTimeUpdate);

    function onTimeUpdateOutside(data) {
      let { time, mediaId } = data;
      if (mediaId == "") return;
      let mediaRef = getItemFromArr(medias, "fileId", mediaId)?.mediaType == MEDIA_TYPE_VIDEO ? videoRef : audioRef;
      if (!mediaRef.current) return;
      isUpdatedFromOutside.current = true;
      mediaRef.current.currentTime = time;
      dispatch(setCurrentTime(time));
      if (time == mediaRef?.current.duration) dispatch(setIsPlaying(false));
    }
    EventBus.on(TIME_UPDATE_OUTSIDE, onTimeUpdateOutside)

    // Remove the event listeners when the component unmounts
    return () => {
      window.removeEventListener(RESIZED_WINDOW, handleResize);
      EventBus.remove(RESIZED_SIDEBAR, handleResize);
      videoRef?.current?.removeEventListener(MEDIA_TIME_UPDATE, onVideoTimeUpdate);
      audioRef?.current?.removeEventListener(MEDIA_TIME_UPDATE, onAudioTimeUpdate);
      EventBus.remove(TIME_UPDATE_OUTSIDE, onTimeUpdateOutside);
    };
  }, [medias]);

  useEffect(() => {
    handleResize();
  }, [showMedia]);

  useEffect(() => {
    handleResize();
    dispatch(setIsPlaying(autoPlay));
  }, [selectedMediaId]);

  useEffect(() => {
    if (selectedMediaId == "") return;
    isPlaying ? getItemFromArr(medias, "fileId", selectedMediaId)?.mediaType == MEDIA_TYPE_VIDEO ? videoRef.current.play() : audioRef.current.play() : getItemFromArr(medias, "fileId", selectedMediaId)?.mediaType == MEDIA_TYPE_VIDEO ? videoRef.current.pause() : audioRef.current.pause();
  }, [isPlaying]);

  useEffect(() => {
    if (selectedMediaId == "") return;
    getItemFromArr(medias, "fileId", selectedMediaId)?.mediaType == MEDIA_TYPE_VIDEO ? videoRef.current.playbackRate = frameSpeed : audioRef.current.playbackRate = frameSpeed;
  }, [frameSpeed]);

  useEffect(() => {
    if (selectedMediaId == "") return;
    getItemFromArr(medias, "fileId", selectedMediaId)?.mediaType == MEDIA_TYPE_VIDEO ? videoRef.current.volume = volume / 100 : audioRef.current.volume = volume / 100;
  }, [volume]);

  return (
    <div className={`flex ${mediaSide ? "" : "flex-row-reverse"}`}>
      <video ref={videoRef} src={getItemFromArr(medias, "fileId", selectedMediaId)?.mediaType == MEDIA_TYPE_VIDEO ? getItemFromArr(medias, "fileId", selectedMediaId)?.previewURL : ""} className={`fixed ${mediaSide ? "pl-10 pr-6" : "pl-6 pr-10"} w-96 h-72 ${getItemFromArr(medias, "fileId", selectedMediaId)?.mediaType == MEDIA_TYPE_VIDEO && showMedia ? "" : "hidden"}`}/>
      <audio ref={audioRef} src={getItemFromArr(medias, "fileId", selectedMediaId)?.mediaType == MEDIA_TYPE_AUDIO ? getItemFromArr(medias, "fileId", selectedMediaId)?.previewURL : ""} className={`hidden`} />
      <div ref={editorRef} style={{padding: showMedia ? mediaSide ? "0 0 0 " + videoWidth + "px" : "0 " + videoWidth + "px 0 0" : ""}}>
        <TEditor />
      </div>
    </div>
  );
};

export default Home;