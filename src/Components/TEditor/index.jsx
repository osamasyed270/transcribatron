import { useEffect, useRef, useState } from "react";

//redux
import { useSelector, useDispatch } from "react-redux";
import { setZoomTranscriptNum, toggleSpeaker } from "@/redux-toolkit/reducers/Editor";
import { toggleNote, toggleSearch, setPlaylistSidebarPosition, setNoteSidebarPosition, setSearchSidebarPosition } from "@/redux-toolkit/reducers/Sidebar";
import { toggleMediaSide } from "@/redux-toolkit/reducers/Media";

// components
import TBody from "./TBody";

// material
import {
    Menu,
    MenuHandler,
    MenuList,
    MenuItem,
    Button,
    Popover,
    PopoverHandler,
    PopoverContent,
} from "@material-tailwind/react";

import { Github } from '@uiw/react-color';

// icons
import { AiOutlineHighlight, AiOutlineBold, AiOutlineItalic, AiOutlineUnderline, AiOutlineFontColors} from "react-icons/ai";
import { RxDividerVertical } from "react-icons/rx";
import { MdKeyboardArrowUp, MdKeyboardArrowDown } from "react-icons/md";
import { AiOutlineCheck } from "react-icons/ai";
import { LuUndo2, LuRedo2 } from "react-icons/lu";
import { TbSettingsCode } from "react-icons/tb";
import { BiChevronDown } from "react-icons/bi";

// constant
import { EventBus } from "@/utils/Functions";
import { BOLD, FONT_COLOR, HIGHLIGHT_BG, ITALIC, UNDERLINE, RESIZED_FUNCTION_BAR, MEDIUM_GRAY } from "@/utils/Constant";
import { setShowMedia } from "../../redux-toolkit/reducers/Media";

const TEditor = () => {
    const dispatch = useDispatch();
    const zoomTranscriptInputRef = useRef();

    const { playlistOrder, noteOrder, searchOrder } = useSelector((state) => state.sidebar); //true: left, false: right
    const { mediaSide, showMedia } = useSelector((state) => state.media); //true: left, false: right
    const { zoomTranscriptNum, speakerMethod } = useSelector((state) => state.editor); //true: left, false: right
    const [openFontColorPicker, setOpenFontColorPicker] = useState(false);
    const [openHighlightPicker, setOpenHighlightPicker] = useState(false);
    const [openZoomMenu, setOpenZoomMenu] = useState(false);
    const [openEditMenu, setOpenEditMenu] = useState(false);
    const [openInsertMenu, setOpenInsertMenu] = useState(false);
    const [openViewMenu, setOpenViewMenu] = useState(false);
    const [openFunctionBar, setOpenFunctionBar] = useState(true);
    const [zoomTranscript, setZoomTranscript] = useState("100%");
    const [functionBarWidth, setFunctionBarWidth] = useState(0);
    const [actionStyle, setActionStyle] = useState();
    const [changedFontClr, setChangedFontClr] = useState();
    const [changedHighlightClr, setChangedHighlightClr] = useState();
    const [changeStyle, setChangeStyle] = useState(false);
    const [fontColor, setFontColor] = useState(MEDIUM_GRAY);
    const [highlightBg, setHighlightBg] = useState(MEDIUM_GRAY);
    const [undo, setUndo] = useState(false);
    const [redo, setRedo] = useState(false);
    const [enableUndo, setEnableUndo] = useState(false);
    const [enableRedo, setEnableRedo] = useState(false);

    const onKeyDownZoomTranscriptInput = (e) => {
        if (e.key !== 'Enter') return;
        if (/\d/.test(zoomTranscript)) {
            let num = zoomTranscript.match(/\d+/)[0] * 1;
            num = num < 50 ? 50 : num > 200 ? 200 : num;
            dispatch(setZoomTranscriptNum(num));
            setZoomTranscript(num + "%");
        } else {
            setZoomTranscript(zoomTranscriptNum + "%");
        }
    }

    const onFocusZoomTranscriptMenu = () => {
        setTimeout(() => {
            zoomTranscriptInputRef.current.focus();
        }, 100)
    }

    const onBlurZoomTranscriptMenu = () => {
        zoomTranscriptInputRef.current.blur();
    }

    useEffect(() => {
        function onResizedFunctionBar(width) {
            setFunctionBarWidth(width)
        }
        EventBus.on(RESIZED_FUNCTION_BAR, onResizedFunctionBar);
        return () => {
            EventBus.remove(RESIZED_FUNCTION_BAR, onResizedFunctionBar);
        };
    }, [])

    const onClickEditStyle = (actionStyle) => {
        setActionStyle(actionStyle);
        if (actionStyle == FONT_COLOR && fontColor != MEDIUM_GRAY)
            setChangedFontClr(fontColor);
        if (actionStyle == HIGHLIGHT_BG && highlightBg != MEDIUM_GRAY)
            setChangedHighlightClr(highlightBg);
        setChangeStyle(!changeStyle);
    }

    const onChangeFontClr = (clr) => {
        setFontColor(clr.hex);
        setActionStyle(FONT_COLOR);
        setChangedFontClr(clr.hex);
        setChangeStyle(!changeStyle);
    }

    const onChangeHighlightBg = (clr) => {
        setHighlightBg(clr.hex);
        setActionStyle(HIGHLIGHT_BG);
        setChangedHighlightClr(clr.hex);
        setChangeStyle(!changeStyle);
    }

    return (
        <>
            <div className={`px-10 justify-items-end self-center grid w-full ${!openFunctionBar ? "" : "hidden"} h-8`} style={{"width" : functionBarWidth == 0 ? "100%" : functionBarWidth+"px"}}>
                <MdKeyboardArrowDown onClick={() => setOpenFunctionBar(!openFunctionBar)} className={`self-center transition-transform w-[30px] h-[30px] text-custom-gray cursor-pointer`} />
            </div>
            <div className={`${openFunctionBar ? "" : "hidden"} fixed z-30 bg-white flex pb-5 pt-8 px-10`} style={{"width" : functionBarWidth == 0 ? "100%" : functionBarWidth+"px"}}>
                <div className={`flex gap-2 `}>
                    <div className="flex gap-4 self-center select-none">
                        <LuUndo2 className={`${enableUndo ? "text-custom-black" : "text-custom-medium-gray"} cursor-pointer`} onClick={() => enableUndo && setUndo(!undo)}/>
                        <LuRedo2 className={`${enableRedo ? "text-custom-black" : "text-custom-medium-gray"} cursor-pointer`} onClick={() => enableRedo && setRedo(!redo)}/>
                    </div>
                    <RxDividerVertical className="text-custom-medium-gray self-center" />
                    <div className="flex gap-4 self-center select-none">
                        <AiOutlineBold className="text-custom-medium-gray self-center cursor-pointer" onClick={() => onClickEditStyle(BOLD)} />
                        <AiOutlineItalic className="text-custom-medium-gray self-center cursor-pointer" onClick={() => onClickEditStyle(ITALIC)} />
                        <AiOutlineUnderline className="text-custom-medium-gray self-center cursor-pointer" onClick={() => onClickEditStyle(UNDERLINE)} />
                        <div className="flex">
                            <AiOutlineFontColors onClick={() => onClickEditStyle(FONT_COLOR)} className="cursor-pointer text-custom-medium-gray" style={{color: fontColor}}/>
                            <Popover placement="bottom-end" open={openFontColorPicker} handler={setOpenFontColorPicker}>
                                <PopoverHandler>
                                    <button className="flex outline-none text-custom-medium-gray">
                                        <BiChevronDown className={`transition-transform ${openFontColorPicker ? "rotate-180" : ""}`} />
                                    </button>
                                </PopoverHandler>
                                <PopoverContent className="z-50 bg-opacity-0 border-opacity-0 shadow-none p-0 pt-2"><Github color={fontColor} onChange={onChangeFontClr} /></PopoverContent>
                            </Popover>
                        </div>
                        <div className="flex">
                            <AiOutlineHighlight onClick={() => onClickEditStyle(HIGHLIGHT_BG)} className="cursor-pointer text-custom-medium-gray" style={{color: highlightBg}} />
                            <Popover placement="bottom-end" open={openHighlightPicker} handler={setOpenHighlightPicker}>
                                <PopoverHandler>
                                    <button className="flex outline-none text-custom-medium-gray">
                                        <BiChevronDown className={`transition-transform ${openHighlightPicker ? "rotate-180" : ""}`} />
                                    </button>
                                </PopoverHandler>
                                <PopoverContent className="z-50 bg-opacity-0 border-opacity-0 shadow-none p-0 pt-2"><Github color={highlightBg} onChange={onChangeHighlightBg}/></PopoverContent>
                            </Popover>
                        </div>
                        <TbSettingsCode className="text-custom-medium-gray self-center cursor-pointer" />
                    </div>
                    <RxDividerVertical className="text-custom-medium-gray self-center" />
                    <div className="flex gap-4 self-center" onFocus={onFocusZoomTranscriptMenu} onBlur={() => onBlurZoomTranscriptMenu()}>
                        <Menu open={openZoomMenu} handler={setOpenZoomMenu}>
                            <MenuHandler>
                                <Button
                                    variant="text"
                                    className="flex items-center text-sm outline-none capitalize tracking-normal hover:bg-white text-custom-black font-light px-2 gap-1"
                                >
                                    <input ref={zoomTranscriptInputRef} onKeyDown={onKeyDownZoomTranscriptInput} className="w-10 outline-none" value={zoomTranscript} onChange={(e) => setZoomTranscript(e.target.value)} />
                                    <BiChevronDown className={`transition-transform ${openZoomMenu ? "rotate-180" : ""}`}/>
                                </Button>
                            </MenuHandler>
                            <MenuList>
                                <MenuItem onClick={() => { setZoomTranscript("50%"); dispatch(setZoomTranscriptNum(50)) }}>50%</MenuItem>
                                <MenuItem onClick={() => { setZoomTranscript("75%"); dispatch(setZoomTranscriptNum(75)) }}>75%</MenuItem>
                                <MenuItem onClick={() => { setZoomTranscript("90%"); dispatch(setZoomTranscriptNum(90)) }}>90%</MenuItem>
                                <MenuItem onClick={() => { setZoomTranscript("100%"); dispatch(setZoomTranscriptNum(100)) }}>100%</MenuItem>
                                <MenuItem onClick={() => { setZoomTranscript("125%"); dispatch(setZoomTranscriptNum(125)) }}>125%</MenuItem>
                                <MenuItem onClick={() => { setZoomTranscript("150%"); dispatch(setZoomTranscriptNum(150)) }}>150%</MenuItem>
                                <MenuItem onClick={() => { setZoomTranscript("200%"); dispatch(setZoomTranscriptNum(200)) }}>200%</MenuItem>
                            </MenuList>
                        </Menu>
                    </div>
                    <RxDividerVertical className="text-custom-medium-gray self-center" />
                    <div className="flex gap-4 self-center">
                        <Menu open={openEditMenu} handler={setOpenEditMenu}>
                            <MenuHandler>
                                <Button
                                    variant="text"
                                    className="flex items-center text-sm outline-none capitalize tracking-normal hover:bg-white text-custom-black font-light px-2 gap-1"
                                >
                                    Edit
                                    <BiChevronDown className={`transition-transform ${openEditMenu ? "rotate-180" : ""}`}/>
                                </Button>
                            </MenuHandler>
                            <MenuList>
                                <MenuItem><p className="w-[100px]">Undo</p></MenuItem>
                                <MenuItem><p className="w-[100px]">Redo</p></MenuItem>
                                <MenuItem onClick={() => dispatch(toggleSearch())}><p className="w-[100px]">Find</p></MenuItem>
                                <MenuItem><p className="w-[100px]">Replace</p></MenuItem>
                            </MenuList>
                        </Menu>
                        <Menu open={openInsertMenu} handler={setOpenInsertMenu}>
                            <MenuHandler>
                                <Button
                                    variant="text"
                                    className="flex items-center text-sm outline-none capitalize tracking-normal hover:bg-white text-custom-black font-light px-2 gap-1"
                                >
                                    Insert
                                    <BiChevronDown className={`transition-transform ${openInsertMenu ? "rotate-180" : ""}`}/>
                                </Button>
                            </MenuHandler>
                            <MenuList>
                                <MenuItem><p className="w-[100px]">Link</p></MenuItem>
                                <MenuItem><p className="w-[100px]">Bullets</p></MenuItem>
                                <MenuItem><p className="w-[100px]">Numbering</p></MenuItem>
                                <MenuItem onClick={() => dispatch(toggleNote())}><p className="w-[100px]">Notes</p></MenuItem>
                                <MenuItem><p className="w-[100px]">Section</p></MenuItem>
                            </MenuList>
                        </Menu>
                        <Menu open={openViewMenu} handler={setOpenViewMenu}>
                            <MenuHandler>
                                <Button
                                    variant="text"
                                    className="flex items-center text-sm outline-none capitalize tracking-normal hover:bg-white text-custom-black font-light px-2 gap-1"
                                >
                                    View
                                    <BiChevronDown className={`transition-transform ${openViewMenu ? "rotate-180" : ""}`}/>
                                </Button>
                            </MenuHandler>
                            <MenuList>
                                <MenuItem>
                                    <Menu placement="right-start" offset={24}>
                                        <MenuHandler><p className="w-[100px]">Search</p></MenuHandler>
                                        <MenuList>
                                            <MenuItem value="searchPositionLeft" onClick={() => searchOrder < 0 ? dispatch(setSearchSidebarPosition(true)) : ''}>
                                                <span className="flex cursor-pointer items-center gap-2"><AiOutlineCheck className={`${searchOrder >= 0 ? "" : "invisible"}`} />Left</span>
                                            </MenuItem>
                                            <MenuItem value="searchPositionRight" onClick={() => searchOrder >= 0 ? dispatch(setSearchSidebarPosition(false)) : ''}>
                                                <span className="flex cursor-pointer items-center gap-2"><AiOutlineCheck className={`${searchOrder < 0 ? "" : "invisible"}`} />Right</span>
                                            </MenuItem>                               
                                        </MenuList>
                                    </Menu>
                                </MenuItem>
                                <MenuItem>
                                    <Menu placement="right-start" offset={24}>
                                        <MenuHandler><p className="w-[100px]">Note</p></MenuHandler>
                                        <MenuList>
                                            <MenuItem name="notePositionLeft" onClick={() => noteOrder < 0 ? dispatch(setNoteSidebarPosition(true)) : ''}>
                                                <span className="flex cursor-pointer items-center gap-2"><AiOutlineCheck className={`${noteOrder >= 0 ? "" : "invisible"}`} />Left</span>
                                            </MenuItem>
                                            <MenuItem name="notePositionRight" onClick={() => noteOrder >= 0 ? dispatch(setNoteSidebarPosition(false)) : ''}>
                                                <span className="flex cursor-pointer items-center gap-2"><AiOutlineCheck className={`${noteOrder < 0 ? "" : "invisible"}`} />Right</span>
                                            </MenuItem>                                    
                                        </MenuList>
                                    </Menu>
                                </MenuItem>
                                <MenuItem>
                                    <Menu placement="right-start" offset={24}>
                                        <MenuHandler><p className="w-[100px]">PlayList</p></MenuHandler>
                                        <MenuList>
                                            <MenuItem name="playlistPositionLeft" onClick={() => playlistOrder < 0 ? dispatch(setPlaylistSidebarPosition(true)) : ''}>
                                                <span className="flex cursor-pointer items-center gap-2"><AiOutlineCheck className={`${playlistOrder >= 0 ? "" : "invisible"}`} />Left</span>
                                            </MenuItem>
                                            <MenuItem name="playlistPositionRight" onClick={() => playlistOrder >= 0 ? dispatch(setPlaylistSidebarPosition(false)) : ''}>
                                                <span className="flex cursor-pointer items-center gap-2"><AiOutlineCheck className={`${playlistOrder < 0 ? "" : "invisible"}`} />Right</span>
                                            </MenuItem>                              
                                        </MenuList>
                                    </Menu>
                                </MenuItem>
                                <MenuItem>
                                    <Menu placement="right-start" offset={24}>
                                        <MenuHandler><p className="w-[100px]">Speaker Tags</p></MenuHandler>
                                        <MenuList>
                                            <MenuItem name="speakerMethodHorizontal" onClick={() => !speakerMethod ? dispatch(toggleSpeaker()) : ''}>
                                                <span className="flex cursor-pointer items-center gap-2"><AiOutlineCheck className={`${speakerMethod ? "" : "invisible"}`} />Horizontal</span>
                                            </MenuItem>
                                            <MenuItem name="speakerMethodVertical" onClick={() => speakerMethod ? dispatch(toggleSpeaker()) : ''}>
                                                <span className="flex cursor-pointer items-center gap-2"><AiOutlineCheck className={`${!speakerMethod ? "" : "invisible"}`} />Vertical</span>
                                            </MenuItem>                              
                                        </MenuList>
                                    </Menu>
                                </MenuItem>
                                <MenuItem>
                                    <Menu placement="right-start" offset={24}>
                                        <MenuHandler><p className="w-[100px]">Video</p></MenuHandler>
                                        <MenuList>
                                            <MenuItem name="videoPositionLeft" onClick={() => !mediaSide ? dispatch(toggleMediaSide()) : ''}>
                                                <span className="flex cursor-pointer items-center gap-2"><AiOutlineCheck className={`${mediaSide ? "" : "invisible"}`} />Left</span>
                                            </MenuItem>
                                            <MenuItem name="videoPositionRight" onClick={() => mediaSide ? dispatch(toggleMediaSide()) : ''}>
                                                <span className="flex cursor-pointer items-center gap-2"><AiOutlineCheck className={`${!mediaSide ? "" : "invisible"}`} />Right</span>
                                            </MenuItem>
                                            <MenuItem name="videoShowHide" onClick={() => dispatch(setShowMedia(!showMedia))}>
                                                <span className="flex cursor-pointer items-center gap-2"><AiOutlineCheck className={`invisible`} />{ showMedia ? 'Hide' : 'Show' }</span>
                                            </MenuItem>                             
                                        </MenuList>
                                    </Menu>
                                </MenuItem>
                            </MenuList>
                        </Menu>
                    </div>
                </div>
                <div className="w-full justify-items-end self-center grid">
                    <MdKeyboardArrowUp onClick={() => setOpenFunctionBar(!openFunctionBar)} className={`self-center w-[30px] h-[30px] text-custom-gray cursor-pointer`} />
                </div>
            </div>
            <div className={`${showMedia ? "pl-10" : ""}`}>
                <hr style={{ "width": showMedia ? ((functionBarWidth - 40) + "px") : functionBarWidth == 0 ? "100%" : functionBarWidth+"px" }} className={`fixed z-30 mt-24 bg-white w-full pb-8 border-blue-gray-50 ${openFunctionBar ? "" : "hidden"}`} />
            </div>
            
            <div className={`grid gap-8 px-10 ${openFunctionBar ? "pt-[129px]" : ""}`}>
                <TBody actionStyle={actionStyle} changeStyle={changeStyle} changedFontClr={changedFontClr} changedHighlightClr={changedHighlightClr} undo={undo} redo={redo} setEnableUndo={setEnableUndo} setEnableRedo={setEnableRedo} />
            </div>
        </>
    )
}

export default TEditor;