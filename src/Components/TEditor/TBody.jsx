import { useEffect, useState, useRef } from "react";
// redux
import { useSelector, useDispatch } from "react-redux";
import { setIsPlaying } from "@/redux-toolkit/reducers/Media";

// Components
import TFadeInOut from "../TFadeInOut";

// material
import { Popover, PopoverHandler, PopoverContent} from "@material-tailwind/react";
import { v4 as uuidv4 } from "uuid";

// Toast
import { toast } from "react-hot-toast";

// icons
import { HiMiniUser } from "react-icons/hi2";
import { AiFillCaretDown, AiOutlineDelete } from "react-icons/ai";
import { BiPlay, BiPencil, BiPause } from "react-icons/bi";
import { BsThreeDots } from "react-icons/bs";

// services
import MediaService from "@/services/media";

// utils
import { EventBus, getIndexFromArr, getItemFromArr, isEmpty, msToTime, getModifierState } from "@/utils/Functions";
import { TIME_UPDATE_OUTSIDE, SET_LOADING, BOLD, FONT_COLOR, HIGHLIGHT_BG, ITALIC, UNDERLINE, GRAY, ACTIVE_WORD_COLOR, DEFAULT_FONT_SIZE, SPEAKER_TAG, WORD, TIME_SLIDE_DRAG, KEY_DOWN } from "@/utils/Constant";
import { Caret } from "../../utils/Caret";
import { DEBUG_MODE, KEY_CTRL, KEY_SHIFT, NEW_LINE_SIGN, SELECTION_CHANGE } from "../../utils/Constant";

var track;

const TBody = ({actionStyle, changeStyle, changedFontClr, changedHighlightClr, undo, redo, setEnableUndo, setEnableRedo}) => {
    const dispatch = useDispatch();
    const activeWordId = useRef("");
    const lastSelectedWordRange = useRef();
    const willChangedSelection = useRef({});
    const trackIndex = useRef();
    const willTrackSave = useRef();

    const { zoomTranscriptNum, speakerMethod } = useSelector((state) => state.editor); //true: left, false: right
    const { selectedMediaId, medias, isPlaying, currentTime } = useSelector((state) => state.media);
    const [showFade, setShowFade] = useState(false);
    const [showAddSpeaker, setShowAddSpeaker] = useState(false);
    const [selectedEditSpeakerId, setSelectedEditSpeakerId] = useState(-1);
    const [newSpeaker, setNewSpeaker] = useState("");
    const [updatedSpeaker, setUpdatedSpeaker] = useState("");
    const [transcription, setTranscription] = useState({});

    // get active word by time from words array
    const getActiveWord = () => {
        let word;
        if (transcription.words === undefined || (transcription.words && transcription.words.length === 0)) return {};
        word = transcription.words.find(item => currentTime >= item.startTime && currentTime < item.endTime);
        return word === undefined ? {} : word;
    }

    const getBelongedTag = (wordId) => {
        let searchingWord = getItemFromArr(transcription.words, 'id', wordId);
        if (isEmpty(searchingWord)) return {};
        let lastSectionTagId = '', lastSectionTagRangeIndex = -1, lastSpeakerTagId = '', lastSpeakerTagRangeIndex = -1, isPassLastSection = true, isPassLastSpeaker = true;
        let wordCurrentId = getFirstItem(transcription.words).id;
        while (true) {
            let word = getItemFromArr(transcription.words, 'id', wordCurrentId);
            if (isEmpty(word)) break;
            if (isPassLastSection) {
                let sectionTagCurrentId = getFirstSectionTag().id;
                while (true) {
                    let sectionTag = getItemFromArr(transcription.sectionTags, 'id', sectionTagCurrentId);
                    if (isEmpty(sectionTag)) break;
                    if (sectionTag.isWordGroup) {
                        if (sectionTag.range[0] === word.id) {
                            lastSectionTagId = sectionTag.id;
                            lastSectionTagRangeIndex = 0;
                            isPassLastSection = sectionTag.range[0] === sectionTag.range[1];
                            break;
                        }
                    } else {
                        let i = 0;
                        for (; i < sectionTag.range.length; i++) {
                            let speakerTag = getItemFromArr(transcription.speakerTags, 'id', sectionTag.range[i]);
                            if (speakerTag.range[0] === word.id) {
                                lastSectionTagId = sectionTag.id;
                                lastSectionTagRangeIndex = i === 0 ? 0 : -1;
                                lastSpeakerTagId = speakerTag.id;
                                lastSpeakerTagRangeIndex = 0;
                                isPassLastSection = speakerTag.range[0] === speakerTag.range[1] && i === (sectionTag.range - 1);
                                isPassLastSpeaker = speakerTag.range[0] === speakerTag.range[1];
                                break;
                            }
                        }
                        if (i < sectionTag.range.length) break;
                    }
                    if (sectionTag.nextId === '') break;
                    sectionTagCurrentId = sectionTag.nextId;
                }
            } else {
                let lastSectionTag = getItemFromArr(transcription.sectionTags, 'id', lastSectionTagId);
                if (!isEmpty(lastSectionTag)) {
                    if (lastSectionTag.isWordGroup) {
                        if (lastSectionTag.range[1] === word.id) {
                            lastSectionTagRangeIndex = 1;
                            isPassLastSection = true;
                        } else {
                            lastSectionTagRangeIndex = -1;
                        }
                    } else {
                        if (isPassLastSpeaker) {
                            for (let i = 0; i < lastSectionTag.range.length; i++) {
                                let speakerTag = getItemFromArr(transcription.speakerTags, 'id', lastSectionTag.range[i]);
                                if (speakerTag.range[0] === word.id) {
                                    lastSpeakerTagId = speakerTag.id;
                                    lastSpeakerTagRangeIndex = 0;
                                    lastSectionTagRangeIndex = i === 0 ? 0 : -1;
                                    isPassLastSpeaker = speakerTag.range[0] === speakerTag.range[1];
                                    isPassLastSection = speakerTag.range[0] === speakerTag.range[1] && i === (lastSectionTag.range.length - 1);
                                    break;
                                }
                            }
                        } else {
                            let lastSpeakerTag = getItemFromArr(transcription.speakerTags, 'id', lastSpeakerTagId);
                            if (lastSpeakerTag.range[1] === word.id) {
                                lastSpeakerTagRangeIndex = 1;
                                lastSectionTagRangeIndex = lastSectionTag.range[lastSectionTag.range.length - 1] === lastSpeakerTagId ? 1 : lastSectionTagRangeIndex;
                                isPassLastSpeaker = true;
                                isPassLastSection = lastSectionTag.range[lastSectionTag.range.length - 1] === lastSpeakerTagId;
                            } else {
                                lastSpeakerTagRangeIndex = -1;
                                lastSectionTagRangeIndex = -1;
                            }
                        }
                    }
                }
            }
            if (searchingWord.id === word.id || word.nextId === '') break;
            wordCurrentId = word.nextId;
        }
        return { sectionTagId: lastSectionTagId, sectionTagRangeIndex: lastSectionTagRangeIndex, speakerTagId: lastSpeakerTagId, speakerTagRangeIndex: lastSpeakerTagRangeIndex };
    }

    // get the first wordId from the given range
    const getFirstItem = (arr) => {
        return arr.find((item, index, array) => item.prevId === '' && item.startTime === Math.min(...array.map(obj => obj.startTime)));
    }

    // get the first sectionTag from the given range
    const getFirstSectionTag = () => {
        let arr = [];
        for (let i = 0; i < transcription.sectionTags.length; i++)
            arr.push({
                id: transcription.sectionTags[i].id,
                prevId: transcription.sectionTags[i].prevId,
                nextId: transcription.sectionTags[i].nextId,
                startTime: transcription.sectionTags[i].isWordGroup
                    ? getItemFromArr(transcription.words, 'id', transcription.sectionTags[i].range[0]).startTime
                    : getItemFromArr(transcription.speakerTags, 'id', transcription.sectionTags[i].range[0]).startTime
            });
        return getFirstItem(arr);
    }

    // check if the caret is in editor at the current
    const isCaretInEditor = (range) => {
        if (!range?.anchorNode) return !!range.startContainer?.parentNode?.classList?.contains('word');
        else return !!range.anchorNode.parentNode?.classList?.contains('word');
    }

    const isCaretInTagPole = (updatedTranscription, wordId, offset) => {
        let word = getItemFromArr(updatedTranscription.words, 'id', wordId);
        let belongedTag = getBelongedTag(wordId);
        let belongedSectionTag = getItemFromArr(updatedTranscription.sectionTags, 'id', belongedTag.sectionTagId);
        if ((belongedSectionTag.isWordGroup && ((belongedTag.sectionTagRangeIndex === 0 && offset === 1) ||
                                                (belongedTag.sectionTagRangeIndex === 1 && offset === (word.word.length + 1)))) ||
            (!belongedSectionTag.isWordGroup && ((belongedTag.speakerTagRangeIndex === 0 && offset === 1) ||
                                                (belongedTag.speakerTagRangeIndex === 1 && offset === (word.word.length + 1)))))
            return true;
    }

    const isAvailableOnSplit = (updatedTranscription, wordId, offset) => {
        return offset !== 1 && !isCaretInTagPole(updatedTranscription, wordId, offset);
    }

    const getWordRange = (selection) => {
        if (!isCaretInEditor(selection)) return;
        let range = selection.getRangeAt(0);
        let wordRange = {};
        wordRange.startId = range.startContainer.parentNode.id;
        wordRange.startOffset = range.startOffset;
        wordRange.endId = range.endContainer.parentNode.id;
        wordRange.endOffset = range.endOffset;
        return wordRange;
    }

    const delSectionTag = async (updatedTranscription, sectionTagId) => {
        let sectionTag = getItemFromArr(updatedTranscription.sectionTags, 'id', sectionTagId);
        let prevSectionTag = getItemFromArr(updatedTranscription.sectionTags, 'id', sectionTag.prevId);
        let nextSectionTag = getItemFromArr(updatedTranscription.sectionTags, 'id', sectionTag.nextId);
        if (isEmpty(prevSectionTag) && !isEmpty(nextSectionTag)) nextSectionTag.prevId = '';
        else if (!isEmpty(prevSectionTag) && isEmpty(nextSectionTag)) prevSectionTag.nextId = '';
        else if (!isEmpty(prevSectionTag) && !isEmpty(nextSectionTag)) {
            prevSectionTag.nextId = nextSectionTag.id;
            nextSectionTag.prevId = prevSectionTag.id;
        }
        let sectionTagIndex = getIndexFromArr(updatedTranscription.sectionTags, 'id', sectionTag.id);
        updatedTranscription.sectionTags.splice(sectionTagIndex, 1);
    }

    const delSpeakerTag = async (updatedTranscription, speakerTagId, belongedSectionTagId) => {
        let speakerTag = getItemFromArr(updatedTranscription.speakerTags, 'id', speakerTagId);
        if (isEmpty(speakerTag)) return;

        let belongedSectionTag = getItemFromArr(updatedTranscription.sectionTags, 'id', belongedSectionTagId);
        if (belongedSectionTag.range.length === 1) await delSectionTag(updatedTranscription, belongedSectionTag.id);
        else
            for (let i = 0; i < belongedSectionTag.range.length; i++)
                if (belongedSectionTag.range[i] === speakerTag.id) {
                    belongedSectionTag.range.splice(i, 1);
                    break;
                }

        let speakerTagIndex = getIndexFromArr(updatedTranscription.speakerTags, 'id', speakerTag.id);
        updatedTranscription.speakerTags.splice(speakerTagIndex, 1);
    }

    const delWord = async (updatedTranscription, wordId) => {
        if (wordId === '') return;
        let word = getItemFromArr(updatedTranscription.words, 'id', wordId);
        let belongedTag = getBelongedTag(word.id);
        let belongedSectionTag = getItemFromArr(updatedTranscription.sectionTags, 'id', belongedTag.sectionTagId);
        if (belongedSectionTag.isWordGroup) {
            if (belongedSectionTag.range[0] === belongedSectionTag.range[1]) {
                await delSectionTag(updatedTranscription, belongedSectionTag.id);
            } else {
                if (belongedTag.sectionTagRangeIndex === 0) {
                    belongedSectionTag.range[0] = word.nextId;
                } else if (belongedTag.sectionTagRangeIndex === 1) {
                    belongedSectionTag.range[1] = word.prevId;
                }
            }
        } else {
            let belongedSpeakerTag = getItemFromArr(updatedTranscription.speakerTags, 'id', belongedTag.speakerTagId);
            if (belongedSpeakerTag.range[0] === belongedSpeakerTag.range[1]) {
                await delSpeakerTag(updatedTranscription, belongedSpeakerTag.id, belongedSectionTag.id);
            } else {
                if (belongedTag.speakerTagRangeIndex === 0) {
                    belongedSpeakerTag.range[0] = word.nextId;
                } else if (belongedTag.speakerTagRangeIndex === 1) {
                    belongedSpeakerTag.range[1] = word.prevId;
                }
            }
        }

        let prevWord = getItemFromArr(updatedTranscription.words, 'id', word.prevId);
        let nextWord = getItemFromArr(updatedTranscription.words, 'id', word.nextId);
        if (isEmpty(prevWord) && !isEmpty(nextWord)) nextWord.prevId = '';
        else if (!isEmpty(prevWord) && isEmpty(nextWord)) prevWord.nextId = '';
        else if (!isEmpty(prevWord) && !isEmpty(nextWord)) {
            prevWord.nextId = nextWord.id;
            nextWord.prevId = prevWord.id;
        }
        let wordIndex = getIndexFromArr(updatedTranscription.words, 'id', word.id);
        updatedTranscription.words.splice(wordIndex, 1);
    }

    const createSpeakerTag = async (updatedTranscription, range, belongedSectionTag, insertIndex) => {
        let newSpeakerTagId = uuidv4();
        updatedTranscription.speakerTags.push({
            id: newSpeakerTagId,
            speakerId: "",
            range,
            startTime: getItemFromArr(updatedTranscription.words, 'id', range[0]).startTime
        })
        if (belongedSectionTag.isWordGroup) {
            belongedSectionTag.range = [newSpeakerTagId];
            belongedSectionTag.isWordGroup = false;
        } else {
            belongedSectionTag.range.splice(insertIndex, 0, newSpeakerTagId);
        }
    }

    const splitSpeakerTag = async (updatedTranscription, splittedSpeakerTagId, belongedSectionTagId) => {
        await splitWord(updatedTranscription);
        let splittedSpeakerTag = getItemFromArr(updatedTranscription.speakerTags, 'id', splittedSpeakerTagId);
        let newRange = [];
        newRange.push(willChangedSelection.current.startWordId);
        newRange.push(splittedSpeakerTag.range[1]);
        splittedSpeakerTag.range[1] = getItemFromArr(updatedTranscription.words, 'id', willChangedSelection.current.startWordId).prevId;
        let belongedSectionTag = getItemFromArr(updatedTranscription.sectionTags, 'id', belongedSectionTagId);
        let insertIndex = 0;
        for (; insertIndex < belongedSectionTag.range.length; insertIndex++) if (belongedSectionTag.range[insertIndex] === splittedSpeakerTag.id) break;
        createSpeakerTag(updatedTranscription, newRange, belongedSectionTag, insertIndex + 1);
    }

    const createSectionTag = async (updatedTranscription, range, isWordGroup, nextId, prevId) => {
        let prevSectionTag = getItemFromArr(updatedTranscription.sectionTags, 'id', prevId);
        let nextSectionTag = getItemFromArr(updatedTranscription.sectionTags, 'id', nextId);
        let newSectionTag = {
            id: uuidv4(),
            label: "Untitled Section",
            nextId,
            prevId,
            range,
            isWordGroup,
            showHeading: true
        }
        if (!isEmpty(prevSectionTag)) prevSectionTag.nextId = newSectionTag.id;
        if (!isEmpty(nextSectionTag)) nextSectionTag.prevId = newSectionTag.id;
        updatedTranscription.sectionTags.splice(updatedTranscription.sectionTags.length, 0, newSectionTag);
    }

    const splitSectionTag = async (updatedTranscription) => {
        await splitWord(updatedTranscription);
        let belongedTag = getBelongedTag(willChangedSelection.current.startWordId);
        let splittedSectionTag = getItemFromArr(updatedTranscription.sectionTags, 'id', belongedTag.sectionTagId);
        if (splittedSectionTag.isWordGroup) {
            let newRange = [];
            newRange.push(willChangedSelection.current.startWordId);
            newRange.push(splittedSectionTag.range[1]);
            splittedSectionTag.range[1] = getItemFromArr(updatedTranscription.words, 'id', willChangedSelection.current.startWordId).prevId;
            createSectionTag(updatedTranscription, newRange, true, splittedSectionTag.nextId, splittedSectionTag.id);
        } else {
            let splitIndex = 0;
            for (; splitIndex < splittedSectionTag.range.length; splitIndex++) if (splittedSectionTag.range[splitIndex] === belongedTag.speakerTagId) break;
            if (belongedTag.speakerTagRangeIndex === 1) splitIndex += 1;
            let newRange = splittedSectionTag.range.slice(splitIndex);
            splittedSectionTag.range = splittedSectionTag.range.slice(0, splitIndex);
            createSectionTag(updatedTranscription, newRange, false, splittedSectionTag.nextId, splittedSectionTag.id);
        }
    }

    const splitTag = async (updatedTranscription, selection) => {
        let wordRange = getWordRange(selection);
        await delWordRange(updatedTranscription, wordRange);
        let offset = willChangedSelection.current.startOffset;
        let word = getItemFromArr(updatedTranscription.words, 'id', willChangedSelection.current.startWordId);
        if (isEmpty(word)) return;
        let belongedTag = getBelongedTag(word.id);
        let belongedSectionTag = getItemFromArr(updatedTranscription.sectionTags, 'id', belongedTag.sectionTagId);
        if (isEmpty(belongedSectionTag)) return;
        if (belongedSectionTag.isWordGroup) {
            if ((belongedTag.sectionTagRangeIndex === 0 && offset === 1) || (belongedTag.sectionTagRangeIndex === 1 && offset === (word.word.length + 1))) return;
            await splitSectionTag(updatedTranscription, belongedSectionTag.id);
        } else {
            let belongedSpeakerTag = getItemFromArr(updatedTranscription.speakerTags, 'id', belongedTag.speakerTagId);
            if ((belongedSectionTag.range[0] === belongedSpeakerTag.id && belongedTag.speakerTagRangeIndex === 0 && offset === 1) ||
                (belongedSectionTag.range[belongedSectionTag.range.length - 1] === belongedSpeakerTag.id && belongedTag.speakerTagRangeIndex === 1 && offset === (word.word.length + 1)))
                return;
            else if (belongedTag.speakerTagRangeIndex === 0 || belongedTag.speakerTagRangeIndex === 1) {
                await splitSectionTag(updatedTranscription, belongedSectionTag.id);
            } else await splitSpeakerTag(updatedTranscription, belongedSpeakerTag.id, belongedSectionTag.id);
        }
    }

    const mergeSectionTag = async (updatedTranscription, firstSectionTag, secondSectionTag) => {
        if (firstSectionTag.isWordGroup) {
            if (secondSectionTag.isWordGroup) {
                firstSectionTag.range[1] = secondSectionTag.range[1];
                await delSectionTag(updatedTranscription, secondSectionTag.id);
            } else {
                await createSpeakerTag(updatedTranscription, firstSectionTag.range, firstSectionTag, 0);
                await mergeSectionTag(updatedTranscription, firstSectionTag, secondSectionTag);
            }
        } else {
            if (secondSectionTag.isWordGroup) {
                await createSpeakerTag(updatedTranscription, secondSectionTag.range, secondSectionTag, 0);
                await mergeSectionTag(updatedTranscription, firstSectionTag, secondSectionTag);
            } else {
                firstSectionTag.range = firstSectionTag.range.concat(secondSectionTag.range);
                await delSectionTag(updatedTranscription, secondSectionTag.id);
            }
        }
    }

    const mergeSpeakerTag = async (updatedTranscription, firstSpeakerTag, secondSpeakerTag, firstBelongedSectionTag, secondBelongedSectionTag) => {
        if (firstBelongedSectionTag.id === secondBelongedSectionTag.id) {
            firstSpeakerTag.range[1] = secondSpeakerTag.range[1];
            await delSpeakerTag(updatedTranscription, secondSpeakerTag.id, secondBelongedSectionTag.id);
        } else {
            await mergeSectionTag(updatedTranscription, firstBelongedSectionTag, secondBelongedSectionTag);
            await mergeSpeakerTag(updatedTranscription, firstSpeakerTag, secondSpeakerTag, firstBelongedSectionTag, firstBelongedSectionTag);
        }
    }

    const mergeWord = async (updatedTranscription, firstWordId, secondWordId) => {
        if (firstWordId === '' || secondWordId === '') return;
        let firstWord = getItemFromArr(updatedTranscription.words, 'id', firstWordId);
        let secondWord = getItemFromArr(updatedTranscription.words, 'id', secondWordId);
        let firstWordBelongedTag = getBelongedTag(firstWord.id);
        let secondWordBelongedTag = getBelongedTag(secondWord.id);
        let firstWordBelongedSection = getItemFromArr(transcription.sectionTags, 'id', firstWordBelongedTag.sectionTagId);
        let secondWordBelongedSection = getItemFromArr(transcription.sectionTags, 'id', secondWordBelongedTag.sectionTagId);
        if (firstWordBelongedTag.sectionTagId === secondWordBelongedTag.sectionTagId) {
            if (firstWordBelongedSection.isWordGroup) {
                willChangedSelection.current = {
                    startWordId: firstWord.id,
                    startOffset: firstWord.word.length + 1,
                    endWordId: firstWord.id,
                    endOffset: firstWord.word.length + 1
                }
                firstWord.word = firstWord.word + secondWord.word;
                firstWord.endTime = secondWord.endTime;
                firstWord.confidence = (firstWord.confidence + secondWord.confidence) / 2;
                await delWord(updatedTranscription, secondWord.id);
            } else {
                if (firstWordBelongedTag.speakerTagId === secondWordBelongedTag.speakerTagId) {
                    willChangedSelection.current = {
                        startWordId: firstWord.id,
                        startOffset: firstWord.word.length + 1,
                        endWordId: firstWord.id,
                        endOffset: firstWord.word.length + 1
                    }
                    firstWord.word = firstWord.word + secondWord.word;
                    firstWord.endTime = secondWord.endTime;
                    firstWord.confidence = (firstWord.confidence + secondWord.confidence) / 2;
                    await delWord(updatedTranscription, secondWord.id);
                } else {
                    let firstWordBelongedSpeaker = getItemFromArr(transcription.speakerTags, 'id', firstWordBelongedTag.speakerTagId);
                    let secondWordBelongedSpeaker = getItemFromArr(transcription.speakerTags, 'id', secondWordBelongedTag.speakerTagId);
                    await mergeSpeakerTag(updatedTranscription, firstWordBelongedSpeaker, secondWordBelongedSpeaker, firstWordBelongedSection, secondWordBelongedSection);
                    await mergeWord(updatedTranscription, firstWordId, secondWordId);
                }
            }
        } else {
            await mergeSectionTag(updatedTranscription, firstWordBelongedSection, secondWordBelongedSection);
            await mergeWord(updatedTranscription, firstWordId, secondWordId);
        }
    }

    const delWordRange = async (updatedTranscription, { startId, startOffset, endId, endOffset }) => {
        if (startId === endId) {
            if (startOffset === endOffset) {
                willChangedSelection.current = {
                    startWordId: startId,
                    startOffset: startOffset,
                    endWordId: endId,
                    endOffset: endOffset
                }
                return;
            }
            let word = getItemFromArr(updatedTranscription.words, 'id', startId);
            let wordEleContent = document.getElementById(word.id)?.textContent || "";
            let wordContent = (wordEleContent.substring(0, startOffset) + wordEleContent.substring(endOffset)).replaceAll('\u00A0', " ").replace(/\s+/g, " ");
            if (wordContent.length === 0 || (wordContent.length === 1 && wordContent.charCodeAt(0) === 32)) {
                let prevWord = getItemFromArr(updatedTranscription.words, 'id', word.prevId);
                willChangedSelection.current = {
                    startWordId: word.prevId,
                    startOffset: prevWord.word.length + 1,
                    endWordId: word.prevId,
                    endOffset: prevWord.word.length + 1
                }
                await delWord(updatedTranscription, word.id);
                return;
            } else if (wordContent.charCodeAt(0) != 32) {
                let prevWord = getItemFromArr(updatedTranscription.words, 'id', word.prevId);
                word.word = wordContent.trim();
                if (isEmpty(prevWord)) {
                    willChangedSelection.current = {
                        startWordId: word.id,
                        startOffset: startOffset,
                        endWordId: word.id,
                        endOffset: startOffset
                    }
                } else {
                    await mergeWord(updatedTranscription, prevWord.id, word.id);
                }
                return;
            }
            willChangedSelection.current = {
                startWordId: word.id,
                startOffset: startOffset,
                endWordId: word.id,
                endOffset: startOffset
            }
            word.word = wordContent.trim();
        } else {
            let wordCurrentId = startId
            while (true) {
                let word = getItemFromArr(updatedTranscription.words, 'id', wordCurrentId);
                if (isEmpty(word)) break;

                if (word.id === startId) await delWordRange(updatedTranscription, { startId: word.id, startOffset, endId: word.id, endOffset: word.word.length + 1 });
                else if (word.id === endId) await delWordRange(updatedTranscription, { startId: word.id, startOffset: 0, endId: word.id, endOffset });
                else await delWord(updatedTranscription, word.id);

                if (word.id === endId || word.nextId === '') break;
                wordCurrentId = word.nextId;
            }
        }
    }

    const highlightActiveWord = () => {
        if (isEmpty(transcription)) return;
        document.getElementById(activeWordId.current)?.classList.remove("activeWord");
        let newActiveWord = getActiveWord()
        if (isEmpty(newActiveWord)) return;
        let activeElement = document.getElementById(newActiveWord.id);
        activeElement?.classList.add("activeWord");
        activeWordId.current = newActiveWord.id;
    }

    useEffect(() => {
        if (medias && medias.length === 0 || selectedMediaId === "") return;
        EventBus.dispatch(SET_LOADING, true);
        setShowFade(false);
        MediaService.getTranscriptionByFileId(getItemFromArr(medias, "fileId", selectedMediaId).fileId) // get transcription data
            .then((res) => {
                if (res.status === 200) {
                    let data = res.data;
                    if (!("sectionTags" in data) || data.sectionTags.length === 0) {
                        let sectionTags = [];
                        let wordCurrentId = "", speakerTagCurrentIndex = -1, previewTag = "", newSectionTagRange = "", prevSectionTagId = "", curTag = "";
                        wordCurrentId = getFirstItem(data.words).id;
                        while (true) {
                            let word = getItemFromArr(data.words, "id", wordCurrentId);
                            if (isEmpty(word)) break;
                            if ((word.startTime != 0 && isEmpty(word.startTime)) || (word.endTime != 0 && isEmpty(word.endTime))) {
                                if (!isEmpty(word.prevId) && !isEmpty(word.nextId)) {
                                    let prevWord = getItemFromArr(data.words, 'id', word.prevId);
                                    let nextWord = getItemFromArr(data.words, 'id', word.nextId);
                                    if (!isEmpty(prevWord)) prevWord.nextId = word.nextId;
                                    if (!isEmpty(nextWord)) nextWord.prevId = word.prevId;
                                    wordCurrentId = nextWord.id;
                                }
                                let wordIndex = getIndexFromArr(data.words, 'id', word.id);
                                data.words.splice(wordIndex, 1);
                                continue;
                            }
                            if (speakerTagCurrentIndex < 0) {
                                let i = 0;
                                for (; i < data.speakerTags.length; i++) {
                                    const speakerTag = data.speakerTags[i];
                                    if (wordCurrentId === speakerTag.range[0]) {
                                        speakerTagCurrentIndex = i;
                                        curTag = SPEAKER_TAG;
                                        break;
                                    }
                                }
                                if (i === data.speakerTags.length) curTag = WORD;
                            } else if (wordCurrentId === data.speakerTags[speakerTagCurrentIndex].range[1]) {
                                newSectionTagRange.push(data.speakerTags[speakerTagCurrentIndex].id);
                                speakerTagCurrentIndex = -1;
                            }
                            if (curTag != previewTag) {
                                if (previewTag != "") {
                                    let range = [];
                                    if (previewTag === WORD) {
                                        range.push(newSectionTagRange);
                                        range.push(word.prevId);
                                    } else
                                        range = newSectionTagRange;
                                    let newSectionTagId = uuidv4();
                                    sectionTags.push({
                                        id: newSectionTagId,
                                        label: "Section" + (sectionTags.length + 1),
                                        nextId: "",
                                        prevId: prevSectionTagId,
                                        range,
                                        isWordGroup: previewTag === WORD,
                                        showHeading: false
                                    })
                                    let prevSectionTagIndex = getIndexFromArr(sectionTags, "id", prevSectionTagId);
                                    if (prevSectionTagIndex > -1) sectionTags[prevSectionTagIndex].nextId = newSectionTagId;
                                    prevSectionTagId = newSectionTagId;
                                }
                                if (curTag === WORD) newSectionTagRange = wordCurrentId;
                                else newSectionTagRange = [];
                                previewTag = curTag;
                            }
                            if (word.nextId === "") break;
                            wordCurrentId = word.nextId;
                        }
                        let range = [];
                        if (previewTag === WORD) {
                            range.push(newSectionTagRange);
                            range.push(wordCurrentId);
                        } else
                            range = newSectionTagRange;
                        let newSectionTagId = uuidv4();
                        sectionTags.push({
                            id: newSectionTagId,
                            label: "Section" + (sectionTags.length + 1),
                            nextId: "",
                            prevId: prevSectionTagId,
                            range,
                            isWordGroup: previewTag === WORD,
                            showHeading: false
                        })
                        let prevSectionTagIndex = getIndexFromArr(sectionTags, "id", prevSectionTagId);
                        if (prevSectionTagIndex > -1) sectionTags[prevSectionTagIndex].nextId = newSectionTagId;
                        data.sectionTags = sectionTags;
                    }
                    if (("speakerTags" in data) && data.speakerTags.length !== 0) {
                        let delSpeakerTagIndexs = [];
                        data.speakerTags.map((speakerTag, index) => {
                            let startWord = getItemFromArr(data.words, 'id', speakerTag.range[0]);
                            let endWord = getItemFromArr(data.words, 'id', speakerTag.range[1]);
                            if (typeof speakerTag.startTime !== 'number' || isEmpty(startWord) || isEmpty(endWord)) delSpeakerTagIndexs.push(index);
                        })
                        delSpeakerTagIndexs.map((delIndex, i) => {
                            data.speakerTags.splice(delIndex - i, 1);
                        })
                    }
                    if (("speakers" in data) && data.speakers.length !== 0) {
                        let delSpeakerIndexs = [];
                        data.speakers.map((speaker, index) => {
                            let i = 0;
                            for (; i < data.speakerTags.length; i++) if (data.speakerTags[i].speakerId === speaker.id) break;
                            if (i === data.speakerTags.length) delSpeakerIndexs.push(index);
                        })
                        delSpeakerIndexs.map((delIndex, i) => {
                            data.speakers.splice(delIndex - i, 1);
                        })
                    }
                    let transcription = {
                        words: data.words,
                        speakers: data.speakers,
                        speakerTags: data.speakerTags,
                        sectionTags: data.sectionTags
                    }
                    setTranscription(transcription);
                } else if (res.status === 400) {
                    toast.error("The selected media has not transcribed yet!");
                    setTranscription({});
                } else {
                    toast.error("Sorry, but an error has been ocurred while getting transcription!");
                    setTranscription({});
                }
                EventBus.dispatch(SET_LOADING, false);
                setShowFade(true);
            })
            .catch((err) => {
                toast.error("Sorry, but an error has been ocurred while getting transcription!");
                if (DEBUG_MODE) console.log(err);
                setTranscription({});
                EventBus.dispatch(SET_LOADING, false);
                setShowFade(true);
            })
        track = { transcriptions: [] };
        trackIndex.current = -1;
        willTrackSave.current = true;
        setEnableUndo(false);
        setEnableRedo(false);
    }, [selectedMediaId, medias]);

    useEffect(() => {
        if (DEBUG_MODE) console.log("transcriptionUpdate>>>>", transcription);
        if (isEmpty(transcription) || isEmpty(track)) {
            // localStorage.setItem(TRANSCRIPTION_TRACK, JSON.stringify({  }));
            track = { transcriptions: [] };
            trackIndex.current = -1;
            willTrackSave.current = true;
            setEnableUndo(false);
            setEnableRedo(false);
        } else {
            if (willTrackSave.current) {
                track.transcriptions.push(JSON.parse(JSON.stringify(transcription)));
                // localStorage.setItem(TRANSCRIPTION_TRACK, JSON.stringify(track));
                trackIndex.current += 1;
                MediaService.updateTranscriptionByFileId(getItemFromArr(medias, "fileId", selectedMediaId).fileId, transcription)
                    .then((res) => {
                        if (res.status === 200) {
                            if(DEBUG_MODE) console.log(res);
                        } else {
                            if(DEBUG_MODE) console.log(res);
                        }
                    })
                    .catch((err) => {
                        if (DEBUG_MODE) console.log(err);
                    });
            } else willTrackSave.current = true;
            setEnableUndo(trackIndex.current > 0);
            setEnableRedo(trackIndex.current < (track.transcriptions.length - 1));
        }
        highlightActiveWord();
        if (!isEmpty(willChangedSelection.current)) {
            let range = willChangedSelection.current;
            let startEle, endEle;
            if (getItemFromArr(transcription.words, 'id', range.startWordId).hasBr) startEle = document.getElementById(range.startWordId)?.childNodes[1];
            else startEle = document.getElementById(range.startWordId)?.childNodes[0];
            if (getItemFromArr(transcription.words, 'id', range.endWordId).hasBr) endEle = document.getElementById(range.endWordId)?.childNodes[1];
            else endEle = document.getElementById(range.endWordId)?.childNodes[0];
            if(startEle != undefined && endEle != undefined && range.startOffset >= 0 && range.endOffset >= 0) Caret.doChange(startEle, range.startOffset, endEle, range.endOffset);
            willChangedSelection.current = {};
        }

        const onTimeSlideDrag = () => {
            setTimeout(() => {
                let activeElement = document.getElementById(activeWordId.current);
                window.scrollTo({ behavior: 'smooth', top: activeElement?.offsetTop - 216 - (window.innerHeight - 314) / 4 })
            }, 50)
        }
        EventBus.on(TIME_SLIDE_DRAG, onTimeSlideDrag);

        const onSelectionChange = (e) => {
            let selection = document.getSelection();
            if (isCaretInEditor(selection)) lastSelectedWordRange.current = selection.getRangeAt(0);
        }
        document.addEventListener(SELECTION_CHANGE, onSelectionChange);

        // Remove the event listeners when the component unmounts
        return () => {
            EventBus.remove(TIME_SLIDE_DRAG, onTimeSlideDrag);
            document.removeEventListener(SELECTION_CHANGE, onSelectionChange);
        };
    }, [transcription])

    const splitWord = async (updatedTranscription) => {
        let { startWordId, startOffset } = willChangedSelection.current;
        let startWord = getItemFromArr(updatedTranscription.words, 'id', startWordId);
        if (!isAvailableOnSplit(updatedTranscription, startWordId, startOffset)) return;
        if ((startOffset - 1) === startWord.word.length) {
            willChangedSelection.current = {
                startWordId: startWord.nextId,
                startOffset: 1,
                endWordId: startWord.nextId,
                endOffset: 1
            }
            return;
        }
        let newWord = {
            id: uuidv4(),
            prevId: startWordId,
            nextId: startWord.nextId,
            word: startWord.word.substring(startOffset - 1),
            startTime: startWord.startTime + (startOffset - 1) / startWord.word.length * (startWord.endTime - startWord.startTime),
            endTime: startWord.endTime,
            confidence: startWord.confidence,
        }
        startWord.nextId = newWord.id;
        startWord.word = startWord.word.substring(0, startOffset - 1);
        startWord.endTime = newWord.startTime;
        let nextWord = getItemFromArr(updatedTranscription.words, 'id', newWord.nextId);
        nextWord.prevId = newWord.id;
        updatedTranscription.words.push(newWord);
        willChangedSelection.current = {
            startWordId: newWord.id,
            startOffset: 1,
            endWordId: newWord.id,
            endOffset: 1
        }
        let belongedTag = getBelongedTag(startWord.id);
        let belongedSectionTag = getItemFromArr(updatedTranscription.sectionTags, 'id', belongedTag.sectionTagId);
        if (belongedSectionTag.isWordGroup && belongedTag.sectionTagRangeIndex === 1) belongedSectionTag.range[1] = newWord.id
        else if (!belongedSectionTag.isWordGroup && belongedTag.speakerTagRangeIndex === 1) {
            let speakerTag = getItemFromArr(updatedTranscription.speakerTags, 'id', belongedTag.speakerTagId);
            speakerTag.range[1] = newWord.id;
        }
    }

    const insertTextToEditor = async (updatedTranscription, txt, selection) => {
        let wordRange = getWordRange(selection);
        await delWordRange(updatedTranscription, wordRange);
        if (txt.length === 0) return;
        let txtArr = txt.replaceAll('\u00A0', " ").replace(/\n+/g, " " + NEW_LINE_SIGN).replace(/\s+/g, " ").split(' ');
        for (let i = 0; i < txtArr.length; i++) {
            let txt = txtArr[i];
            txt = txt.split(NEW_LINE_SIGN);
            let hasBr = txt.length === 2;
            if (hasBr) txt = txt[1];
            else txt = txt[0];
            if (i != 0) await splitWord(updatedTranscription);
            let { startWordId, startOffset } = willChangedSelection.current;
            let startWord = getItemFromArr(updatedTranscription.words, 'id', startWordId);
            startWord.word = startWord.word.substring(0, startOffset - 1) + txt + startWord.word.substring(startOffset - 1);
            if (i != 0) startWord.hasBr = hasBr && !isCaretInTagPole(updatedTranscription, startWordId, startOffset);
            willChangedSelection.current.startOffset += txt.length;
            willChangedSelection.current.endOffset = willChangedSelection.current.startOffset;
        }
    }
    
    const getStringFromWordRange = async (updatedTranscription, { startId, startOffset, endId, endOffset }) => {
        let res = '';
        if (startId === endId) {
            if (startOffset != endOffset) {
                let word = getItemFromArr(updatedTranscription.words, 'id', startId);
                res = word.word.substring(startOffset - 1, endOffset - 1);
            }
        } else {
            let wordCurrentId = startId;
            while (true) {
                let word = getItemFromArr(updatedTranscription.words, 'id', wordCurrentId);
                if (isEmpty(word)) break;

                res += word.hasBr ? "\n" : " ";
                if (word.id === startId) res += word.word.substring(startOffset - 1);
                else if (word.id === endId) res += word.word.substring(0, endOffset - 1);
                else res += word.word;
                
                if (word.id === endId || word.nextId === '') break;
                wordCurrentId = word.nextId;
            }
        }
        return res;
    }

    const handleCutTBody = async (e) => {
        let selection = document.getSelection();
        if (!isCaretInEditor(selection)) return true;
        e.preventDefault();
        let updatedTranscription = { ...transcription };
        let wordRange = getWordRange(selection);
        e.clipboardData.setData('text/plain', await getStringFromWordRange(updatedTranscription, wordRange));
        await delWordRange(updatedTranscription, wordRange);
        setTranscription(updatedTranscription);
    }

    const handlePasteTBody = async (e) => {
        let selection = document.getSelection();
        if (!isCaretInEditor(selection)) return true;
        e.preventDefault();
        let updatedTranscription = { ...transcription };
        await insertTextToEditor(updatedTranscription, e.clipboardData.getData('text'), selection);
        setTranscription(updatedTranscription);
    }

    const doBSDel = async (updatedTranscription, selection, isBS, isCtrl) => {
        let { startId, startOffset, endId, endOffset } = getWordRange(selection);
        if (startId === endId && startOffset === endOffset) {
            let word = getItemFromArr(updatedTranscription.words, 'id', startId);
            if (startOffset === 1) {
                if (isBS) {
                    if (isCtrl) {
                        await delWord(updatedTranscription, word.prevId);
                    } else {
                        await mergeWord(updatedTranscription, word.prevId, word.id);
                    }
                } else {
                    if (isCtrl) {
                        await delWord(updatedTranscription, word.id);
                    } else {
                        await delWordRange(updatedTranscription, { startId: word.id, startOffset: 1, endId: word.id, endOffset: 2 });
                    }
                }
            } else if (startOffset === (word.word.length + 1)) {
                if (isBS) {
                    if (isCtrl) {
                        await delWord(updatedTranscription, word.id);
                    } else {
                        await delWordRange(updatedTranscription, { startId: word.id, startOffset: startOffset - 1, endId: word.id, endOffset });
                    }
                } else {
                    if (isCtrl) {
                        await delWord(updatedTranscription, word.nextId);
                    } else {
                        await mergeWord(updatedTranscription, word.id, word.nextId);
                    }
                }
            } else {
                if (isBS) {
                    if (isCtrl) {
                        await delWordRange(updatedTranscription, { startId: word.id, startOffset: 1, endId: word.id, endOffset });
                    } else {
                        await delWordRange(updatedTranscription, { startId: word.id, startOffset: startOffset - 1, endId: word.id, endOffset });
                    }
                } else {
                    if (isCtrl) {
                        await delWordRange(updatedTranscription, { startId: word.id, startOffset, endId: word.id, endOffset: word.word.length + 1 });
                    } else {
                        await delWordRange(updatedTranscription, { startId: word.id, startOffset, endId: word.id, endOffset: endOffset + 1 });
                    }
                }
            }
        } else await delWordRange(updatedTranscription, { startId, startOffset, endId, endOffset });
    }

    const doUndo = () => {        
        // let track = JSON.parse(localStorage.getItem(TRANSCRIPTION_TRACK)).transcriptions;
        if (trackIndex.current < 1) return;
        trackIndex.current -= 1;
        willTrackSave.current = false;
        setTranscription(track.transcriptions[trackIndex.current]);
    }

    const doRedo = () => {
        // let track = JSON.parse(localStorage.getItem(TRANSCRIPTION_TRACK)).transcriptions;
        if (trackIndex.current > (track.transcriptions.length - 2) ) return;
        trackIndex.current += 1;
        willTrackSave.current = false;
        setTranscription(track.transcriptions[trackIndex.current]);
    }

    useEffect(() => {
        doUndo();
    }, [undo]);

    useEffect(() => {
        doRedo();
    }, [redo])

    const handleKeyDownTBody = async (e) => {
        let selection = document.getSelection();
        if (!isCaretInEditor(selection)) return true;

        let modifier = getModifierState(e);
        if (modifier === KEY_CTRL && e.keyCode === 90) {
            // ctrl + z
            e.preventDefault();
            if (DEBUG_MODE) console.log('undo: ctrl + z');
            doUndo();
        } else if ((modifier === (KEY_CTRL + " " + KEY_SHIFT) && e.keyCode === 90) || (modifier === KEY_CTRL && e.keyCode === 89)) {
            // ctrl + shift + z || ctrl + y
            e.preventDefault();
            if (DEBUG_MODE) console.log('redo: ctrl + shift + z || ctrl + y');
            doRedo();
        } else if (e.keyCode === 8) {
            // backspace
            if (modifier === KEY_CTRL) {
                // ctrl + backspace
                e.preventDefault();
                if (DEBUG_MODE) console.log('remove word: ctrl + backspace');
                let updatedTranscription = { ...transcription };
                await doBSDel(updatedTranscription, selection, true, true);
                setTranscription(updatedTranscription);
            } else if(modifier === '') {
                // only backspace
                e.preventDefault();
                if(DEBUG_MODE) console.log('remove letter: backspace');
                let updatedTranscription = { ...transcription };
                await doBSDel(updatedTranscription, selection, true, false);
                setTranscription(updatedTranscription);
            }
        } else if (e.keyCode === 46) {
            // del
            if (modifier === KEY_CTRL) {
                // ctrl + del
                e.preventDefault();
                if(DEBUG_MODE) console.log('remove word: ctrl + del');
                let updatedTranscription = { ...transcription };
                await doBSDel(updatedTranscription, selection, false, true);
                setTranscription(updatedTranscription);
            } else if(modifier === '') {
                // only del
                e.preventDefault();
                if(DEBUG_MODE) console.log('remove letter: del');
                let updatedTranscription = { ...transcription };
                await doBSDel(updatedTranscription, selection, false, false);
                setTranscription(updatedTranscription);
            }
        } else if (e.keyCode === 32 && (modifier === "" || modifier === KEY_SHIFT)) {
            // space
            e.preventDefault();
            if (DEBUG_MODE) console.log('split word: space');
            let updatedTranscription = { ...transcription };
            await insertTextToEditor(updatedTranscription, ' ', selection);
            setTranscription(updatedTranscription);
        } else if (e.keyCode === 13) {
            // enter
            if (modifier === KEY_SHIFT) {
                // shift + enter
                e.preventDefault();
                if(DEBUG_MODE) console.log('create paragraph: shift + enter');
                let updatedTranscription = { ...transcription };
                await insertTextToEditor(updatedTranscription, '\n', selection);
                setTranscription(updatedTranscription);
            } else if (modifier === '') {
                // only enter
                e.preventDefault();
                if(DEBUG_MODE) console.log('create speaker: enter');
                let updatedTranscription = { ...transcription };
                await splitTag(updatedTranscription, selection);
                setTranscription(updatedTranscription);
            }
        } else if (e.keycode === 27 || e.keyCode === 9) {
            // Esc || Tab
            e.preventDefault();
            if(DEBUG_MODE) console.log('prevent default: Esc || Tab');
        } else if (e.key.length === 1 && (modifier === "" || modifier === KEY_SHIFT)) {
            e.preventDefault();
            if(DEBUG_MODE) console.log('insert letter: ', e.key);
            let updatedTranscription = { ...transcription };
            await insertTextToEditor(updatedTranscription, e.key, selection);
            setTranscription(updatedTranscription);
        }
    }

    useEffect(() => {
        if (!lastSelectedWordRange.current) return;
        if (!isCaretInEditor(lastSelectedWordRange.current)) return;
        if (actionStyle === undefined) return;
        if (actionStyle === FONT_COLOR && changedFontClr === undefined) return;
        if (actionStyle === HIGHLIGHT_BG && changedHighlightClr === undefined) return;
        let range = lastSelectedWordRange.current;
        Caret.doChange(range.startContainer, range.startOffset, range.endContainer, range.endOffset);
        range = {
            start: range.startContainer.parentNode.id,
            end: range.endContainer.parentNode.id,
        }
        let wordCurrentId = range.start;
        let updatedTranscription = { ...transcription };
        while (true) {
            let word = getItemFromArr(updatedTranscription.words, "id", wordCurrentId);
            if(isEmpty(word)) break
            switch (actionStyle) {
                case BOLD:
                    word = {
                        ...word,
                        style: {
                            ...word.style,
                            bold: !word?.style?.bold
                        }
                    }
                    break;
                case ITALIC:
                    word = {
                        ...word,
                        style: {
                            ...word.style,
                            italic: !word?.style?.italic
                        }
                    }
                    break;
                case UNDERLINE:
                    word = {
                        ...word,
                        style: {
                            ...word.style,
                            underline: !word?.style?.underline
                        }
                    }
                    break;
                case FONT_COLOR:
                    word = {
                        ...word,
                        style: {
                            ...word.style,
                            fontClr: word?.style?.fontClr === changedFontClr ? word.id === activeWordId.current ? ACTIVE_WORD_COLOR : GRAY : changedFontClr
                        }
                    }
                    break;
                case HIGHLIGHT_BG:
                    word = {
                        ...word,
                        style: {
                            ...word.style,
                            highlightClr: word?.style?.highlightClr === changedHighlightClr ? "#FFF" : changedHighlightClr
                        }
                    }
                    break;
            }
            updatedTranscription.words[getIndexFromArr(updatedTranscription.words, 'id', wordCurrentId)] = word;
            setTranscription(updatedTranscription);
            if (word.id === range.end || word.nextId === "") break;
            wordCurrentId = word.nextId;
        }
    },[changeStyle])
    
    useEffect(() => {
        if (isPlaying) return;
        if (transcription.speakerTags === undefined) return;
        let speakerTagPlayBtns = document.getElementsByClassName('allSpeakerTagPlayBtn');
        for (let i = 0; i < speakerTagPlayBtns.length; i++) speakerTagPlayBtns[i].style.display = "flex";
        let speakerTagPauseBtns = document.getElementsByClassName('allSpeakerTagPauseBtn');
        for (let i = 0; i < speakerTagPauseBtns.length; i++) speakerTagPauseBtns[i].style.display = "none";
    }, [isPlaying])
    
    useEffect(() => {
        highlightActiveWord();
    }, [currentTime])

    const addNewSpeaker = () => {
        setShowAddSpeaker(false);
        if (newSpeaker.length) {
            let updatedTranscription = { ...transcription };
            updatedTranscription.speakers.push({ id: uuidv4(), label: newSpeaker });
            setTranscription(updatedTranscription);
        }
    }

    const editSpeakerById = () => {
        let updatedTranscription = { ...transcription };
        let updatedIndex = getIndexFromArr(updatedTranscription.speakers, "id", selectedEditSpeakerId);
        if (updatedSpeaker.length) updatedTranscription.speakers[updatedIndex].label = updatedSpeaker;
        else updatedTranscription.speakers.splice(updatedIndex, 1);
        setTranscription(updatedTranscription);
        setSelectedEditSpeakerId(-1);
    }

    const onClickAddSpeaker = (id) => {
        setSelectedEditSpeakerId(-1);
        setShowAddSpeaker(true);
        setNewSpeaker("");
        setTimeout(() => {
            document.getElementById(id).focus();
        }, 10)
    }

    const onClickEditSpeaker = (speaker, editInputId) => {
        setShowAddSpeaker(false);
        setSelectedEditSpeakerId(speaker.id);
        setUpdatedSpeaker(speaker.label);
        setTimeout(() => {
            document.getElementById(editInputId).select();
        }, 10)
    }

    const onEditKeyUp = (e) => {
        const keyCode = e.which || e.keyCode;
        if (keyCode === 13) editSpeakerById();
    }

    const onAddKeyUp = (e) => {
        const keyCode = e.which || e.keyCode;
        if (keyCode === 13) addNewSpeaker();
    }

    const changeSpeakerId = (speakerTagId, newSpeakerId) => {
        let updatedTranscription = { ...transcription };
        let updatedSpeakerTags = updatedTranscription.speakerTags;
        let updatedIndex = getIndexFromArr(updatedSpeakerTags, "id", speakerTagId)
        let updatedSpeakerTag = updatedSpeakerTags[updatedIndex];
        updatedSpeakerTag.speakerId = newSpeakerId;
        updatedSpeakerTags[updatedIndex] = updatedSpeakerTag;
        updatedTranscription.speakerTags = updatedSpeakerTags;
        setTranscription(updatedTranscription);
    }

    const onToggleSpeakerTagPlay = (firstWordId, speakerTagStartTime, playBtnId, pauseBtnId) => {
        if (document.getElementById(playBtnId).style.display === "none") {    // make pause
            document.getElementById(playBtnId).style.display = "flex";
            document.getElementById(pauseBtnId).style.display = "none";
            dispatch(setIsPlaying(false));
        } else {    // make play
            // document.getElementById(activeWordId.current)?.classList.remove("activeWord");
            // document.getElementById(firstWordId).classList.add("activeWord");
            // activeWordId.current = firstWordId;
            let time = speakerTagStartTime === 0 ? 0.000001 : speakerTagStartTime;
            EventBus.dispatch(TIME_UPDATE_OUTSIDE, { time, mediaId: selectedMediaId });
            dispatch(setIsPlaying(true))
            // make other speakerTag paused
            let speakerTagPlayBtns = document.getElementsByClassName('allSpeakerTagPlayBtn');
            for (let i = 0; i < speakerTagPlayBtns.length; i++) speakerTagPlayBtns[i].style.display = "flex";
            let speakerTagPauseBtns = document.getElementsByClassName('allSpeakerTagPauseBtn');
            for (let i = 0; i < speakerTagPauseBtns.length; i++) speakerTagPauseBtns[i].style.display = "none"
            // make clicked speakerTag play
            document.getElementById(playBtnId).style.display = "none";
            document.getElementById(pauseBtnId).style.display = "flex";
        }
    }

    const onClickWord = (e) => {
        let time = e.target.dataset.start * 1 === 0 ? 0.000001 : e.target.dataset.start * 1;
        if (e.target.dataset.start * 1 === 0 && currentTime === 0.000001) highlightActiveWord();
        EventBus.dispatch(TIME_UPDATE_OUTSIDE, { time, mediaId: selectedMediaId });
    }

    const getWords = (range) => {
        let startId = range[0];
        let endId = range[1];
        if (transcription.words === undefined) return;
        let element = [];
        let wordCurrentId = startId;
        while (true) {
            let word = getItemFromArr(transcription.words, "id", wordCurrentId);

            if (isEmpty(word)) break;
            let rawFontSize = Math.ceil(zoomTranscriptNum / 100 * DEFAULT_FONT_SIZE);
            element.push(
                <span
                    key={word.id}
                    id={word.id}
                    data-start={word.startTime}
                    data-duration={word.endTime - word.startTime}
                    onClick={onClickWord}
                    style={{ fontSize: (rawFontSize % 2 === 1 ? (rawFontSize + 1) : rawFontSize) + "px", color: word?.style?.fontClr, backgroundColor: word?.style?.highlightClr}}
                    className={`word ${word?.style?.bold ? "font-bold" : ""} ${word?.style?.italic ? " italic" : ""} ${word?.style?.underline ? " underline" : ""}`}
                >
                    {word.hasBr && <br /> }
                    {" " + word.word}
                </span>
            )
            if (word.id === endId || word.nextId === "") break;
            wordCurrentId = word.nextId;
        }
        return element;
    }

    const getSpeakerTags = (sectionTag) => {
        let { range, isWordGroup } = sectionTag;
        if (transcription.speakerTags === undefined || transcription.speakers === undefined) return;
        let element = [];
        if (isWordGroup) {
            element.push(
                <div key={sectionTag.id}>
                    <p className="text-custom-gray w-full h-auto text-justify">
                        {getWords(range)}
                    </p>
                </div>
            )
        } else 
            for (let i = 0; i < range.length; i++) {
                let speakerTagCurrentId = range[i];
                let speakerTag = getItemFromArr(transcription.speakerTags, "id", speakerTagCurrentId);
                let curSpeaker = getItemFromArr(transcription.speakers, "id", speakerTag.speakerId);
                let speakerTagAddSpeakerInputId = speakerTag.id + "-addInputId";
                let speakerTagPlayBtnId = speakerTag.id + "-playBtnId";
                let speakerTagPauseBtnId = speakerTag.id + "-pauseBtnId";
                element.push(
                    <div key={speakerTag.id} className={`${speakerMethod ? "flex" : ""} `}>
                        <div contentEditable={false} className={`select-none text-custom-sky text-sm ${speakerMethod ? "w-40" : "flex gap-2"}`}>
                            <Popover placement="bottom">
                                <PopoverHandler onClick={() => { setSelectedEditSpeakerId(-1);  setShowAddSpeaker(false)}}>
                                    <div className="flex items-center gap-2 cursor-pointer">
                                        <HiMiniUser />
                                        {curSpeaker.label === undefined ? <p className="text-custom-medium-gray">(New Speaker)</p> : <p>{curSpeaker.label}</p> }
                                        <AiFillCaretDown />
                                    </div>
                                </PopoverHandler>
                                <PopoverContent className="w-52 z-50">
                                    {
                                        transcription.speakers.map((speaker, index) => {
                                            const editSpeakerLabelInputId = speakerTag.id + "-" + speaker.id + "-editInputId";
                                            return (
                                                <div key={speakerTag.id + "-" + speaker.id} >
                                                    <div className={`${selectedEditSpeakerId === speaker.id ? "hidden" : ""} w-full justify-between flex py-1`}>
                                                        <p className={`${curSpeaker.id === speaker.id ? "text-custom-sky" : "text-custom-black"} text-sm cursor-pointer`} onClick={() => changeSpeakerId(speakerTagCurrentId, speaker.id)}>{ speaker.label }</p>
                                                        <BiPencil className="text-xs self-center text-custom-sky cursor-pointer" onClick={() => onClickEditSpeaker(speaker, editSpeakerLabelInputId)} />
                                                    </div>
                                                    <div className={`w-full py-1 flex h-9 gap-1 ${selectedEditSpeakerId === speaker.id ? "" : "hidden"}`}>
                                                        <input
                                                            id={editSpeakerLabelInputId}
                                                            onKeyUp={onEditKeyUp}
                                                            value={updatedSpeaker}
                                                            onChange={(e) => setUpdatedSpeaker(e.target.value)}
                                                            className="h-full w-full rounded border border-custom-sky pl-3 bg-transparent text-sm font-normal text-blue-gray-700 outline outline-0 transition-all"
                                                        />
                                                        <button onClick={editSpeakerById} className="rounded bg-custom-sky px-3 text-xs font-bold text-white">Save</button>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    }
                                    <div>
                                        <div className={`${showAddSpeaker ? "hidden" : ""} py-1 flex items-center justify-between`}>
                                            <p className="text-custom-sky text-sm cursor-pointer" onClick={() => onClickAddSpeaker(speakerTagAddSpeakerInputId)}>+ Add new speaker</p>
                                            <AiOutlineDelete className="cursor-pointer text-red-400" onClick={() => changeSpeakerId(speakerTagCurrentId, "")} />
                                        </div>
                                        <div className={`w-full py-1 flex h-9 gap-1 ${showAddSpeaker ? "" : "hidden"}`}>
                                            <input
                                                id={speakerTagAddSpeakerInputId}
                                                onKeyUp={onAddKeyUp}
                                                value={newSpeaker}
                                                onChange={(e) => setNewSpeaker(e.target.value)}
                                                className="h-full w-full rounded border border-custom-sky pl-3 bg-transparenttext-sm font-normal text-blue-gray-700 outline outline-0 transition-all"
                                            />
                                            <button onClick={addNewSpeaker} className="rounded bg-custom-sky px-3 text-xs font-bold text-white">Save</button>
                                        </div>
                                    </div>
                                </PopoverContent>
                            </Popover>
                            <div className={`flex gap-2 items-center ${speakerMethod ? "mt-2" : ""}`}>
                                <p>{ msToTime(speakerTag.startTime, true) }</p>
                                <div className="cursor-pointer w-12" onClick={() => onToggleSpeakerTagPlay(speakerTag.range[0], speakerTag.startTime, speakerTagPlayBtnId, speakerTagPauseBtnId)}>
                                    <div id={speakerTagPlayBtnId} className="flex items-center allSpeakerTagPlayBtn"><BiPlay /><p className=" self-center">Play</p></div>
                                    <div id={speakerTagPauseBtnId} className="flex items-center allSpeakerTagPauseBtn" style={{display: "none"}}><BiPause /><p>Pause</p></div>
                                </div>
                            </div>
                        </div>
                        <p className="text-custom-gray w-full h-auto text-justify">
                            {getWords(speakerTag.range)}
                        </p>
                    </div>
                )
            }
        return element;
    }

    const switchSectionTagMode = async (sectionTagId) => {
        let updatedTranscription = { ...transcription };
        let sectionTag = getItemFromArr(transcription.sectionTags, 'id', sectionTagId);
        if (!sectionTag.isWordGroup) {
            let startWordId = getItemFromArr(updatedTranscription.speakerTags, 'id', sectionTag.range[0]).range[0];
            let endWordId = getItemFromArr(updatedTranscription.speakerTags, 'id', sectionTag.range[sectionTag.range.length - 1]).range[1];
            sectionTag.range.push(startWordId);
            sectionTag.range.push(endWordId);
            while (true) {
                if (sectionTag.range.length === 2) break;
                await delSpeakerTag(updatedTranscription, sectionTag.range[0], sectionTag.id);
            }
            sectionTag.isWordGroup = !sectionTag.isWordGroup;
        } else await createSpeakerTag(updatedTranscription, sectionTag.range, sectionTag, 0)
        setTranscription(updatedTranscription);
    }

    const toggleTitle = (sectionTagId) => {
        let updatedTranscription = { ...transcription };
        let sectionTag = getItemFromArr(updatedTranscription.sectionTags, 'id', sectionTagId);
        sectionTag.showHeading = !sectionTag.showHeading;
        setTranscription(updatedTranscription);
    }

    const updateSectionHeading = (sectionTagId, newHeading) => {
        let updatedTranscription = { ...transcription };
        let sectionTag = getItemFromArr(updatedTranscription.sectionTags, 'id', sectionTagId);
        sectionTag.label = newHeading;
        setTranscription(updatedTranscription);
    }

    const getSectionTags = () => {
        let element = [];
        let sectionTagCurrentId = getFirstSectionTag().id;
        while (true) {
            let sectionTag = getItemFromArr(transcription.sectionTags, "id", sectionTagCurrentId);
            if (isEmpty(sectionTag)) break;
            element.push(
                <div key={sectionTag.id} className={`flex gap-8 ${sectionTag.nextId === "" ? "" : "mb-8"}`}>
                    <div>
                        <div contentEditable={false}>
                            <input contentEditable={false} className={`text-black outline-none focus:border-2 focus:border-custom-medium-gray text-base mb-2 ${sectionTag.showHeading ? "" : "hidden"}`} value={sectionTag.label} onChange={(e) => updateSectionHeading(sectionTag.id, e.target.value)} />
                        </div>
                        <div className="grid gap-4 outline-none" contentEditable={true} suppressContentEditableWarning={true}>
                            {getSpeakerTags(sectionTag)}
                        </div>
                        <p contentEditable={false} className={`text-custom-black text-xs mt-2 ${sectionTag.showHeading ? "" : "hidden"}`} >- End of {sectionTag.label} -</p>
                    </div>
                    <div contentEditable={false} className="flex gap-4 select-none">
                        <div className=" bg-custom-light-gray h-full w-0.5 "></div>
                        <div>
                            <Popover placement="bottom-end">
                                <PopoverHandler>
                                    <div>
                                        <BsThreeDots className=" text-custom-gray cursor-pointer" />
                                    </div>
                                </PopoverHandler>
                                <PopoverContent>
                                    <div className={` py-1`}>
                                        <p className="text-custom-black justify-end flex text-sm cursor-pointer mb-2" onClick={() => switchSectionTagMode(sectionTag.id)}>Switch to { sectionTag.isWordGroup ? 'speaker' : 'dictation' } mode</p>
                                        <p className="text-custom-black justify-end flex text-sm cursor-pointer" onClick={() => toggleTitle(sectionTag.id)}>{ sectionTag.showHeading ? 'Hide' : 'Show' } title</p>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>
                </div>
            )
            if (sectionTag.nextId === "") break;
            sectionTagCurrentId = sectionTag.nextId;
        }
        return element;
    }

    return (
        <TFadeInOut show={showFade} duration={300} className="outline-none" onKeyDown={handleKeyDownTBody} onPaste={handlePasteTBody} onCut={handleCutTBody}>
            {!isEmpty(transcription) && transcription.sectionTags && transcription.sectionTags.length != 0 && getSectionTags()}
        </TFadeInOut>
    )
}

export default TBody;