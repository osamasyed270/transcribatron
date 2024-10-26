import { useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { DataGrid } from "@mui/x-data-grid";
import VideoFileIcon from "@mui/icons-material/VideoFile";
import AudioFileIcon from "@mui/icons-material/AudioFile";
import TextFileIcon from "@mui/icons-material/TextFields";
import ZipFileIcon from "@mui/icons-material/FolderZip";
import ImageIcon from "@mui/icons-material/Image";
import { MOUSE_MOVE, RESIZED_WINDOW, SET_LOADING, DEBUG_MODE } from "@/utils/Constant";
import { EventBus } from "@/utils/Functions";
import EmailService from "@/services/email";
import { toast } from "react-hot-toast";
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import { Container, Stack } from '@mui/material';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '70vh',
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};

const columns = [
  {
    field: "Recipient",
    headerName: "Recipient",
    width: 250,
    renderCell: (params) => {
      return (
        <div className="flex">
          <div className="ml-1 ">{params.row.to}</div>
        </div>
      );
    },
  },
  {
    field: "Subject",
    headerName: "Subject",
    description: "Email Subject.",
    width: 300,
    valueGetter: (params) => {
      return params.row.subject;
    },
  },
  {
    field: "Received",
    headerName: "Received",
    type: Date,
    width: 190,
    valueGetter: (params) => {
      // Convert Date to a readable string (e.g., "October 10, 2023")
      // return new Date(params.row.date).toUTCString();
      return params.row.headers.date
    },
    sortComparator: (v1, v2, param1, param2) => {
      // Custom sorting function for "Last updated" column
      return (
        new Date(param1.value).getTime() - new Date(param2.value).getTime()
      );
    },
  },
];

function formatFileSize(fileSizeInBytes) {
  const units = ["B", "kB", "MB", "GB", "TB"];
  let size = fileSizeInBytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

const EmailMiddlePanel = (props) => {
  const {currentEmail, setCurrentEmail, currentFolder} = props;
  const currentUser = useSelector((state) => state.admin.currentUser);
  const divOfTableRef = useRef(null);
  const [divWidth, setDivWidth] = useState(1000);
  const [emails, setEmails] = useState([]);

  // for Write New Email modal window dialog
  const [writeNewEmailModalOpen, setWriteNewEmailModalOpen] = useState(false);
  const handleOpenWriteNewEmail = () => {
    setComposeEmailTitle('Compose New Email');
    setWriteNewEmailModalOpen(true);
  }
  const handleOpenReplyToEmail = () => {
    if (currentEmail) {
      setComposeEmailTitle('Compose Reply To Email');
      setEmailDialogContent('Re');
      setWriteNewEmailModalOpen(true);
    }
  }
  const handleOpenForwardToEmail = () => {
    if (currentEmail) {
      setComposeEmailTitle('Compose Forward To Email');
      setEmailDialogContent('Fwd');
      setWriteNewEmailModalOpen(true);
    }
  }
  const handleCloseWriteNewEmail = (event, details) => {
    setWriteNewEmailModalOpen(false);
    clearEmailForm();
  }
  const [recipient, setRecipient] = useState(undefined);
  const [carbonCopy, setCarbonCopy] = useState(undefined);
  const [subject, setSubject] = useState(undefined);
  const [emailBody, setEmailBody] = useState(undefined);
  const clearEmailForm = () => {
    setRecipient(undefined);
    setCarbonCopy(undefined);
    setSubject(undefined);
    setEmailBody(undefined);
  }
  const setEmailDialogContent = (prefix) => {
    setSubject(`${prefix}: ${currentEmail.subject}`);
    setRecipient(currentEmail.from?.replace(/^.*<([^>]+)>.*$/i, '$1'));
    setEmailBody(`\n\nOn ${currentEmail.headers.date} ${currentEmail.from} wrote:\n\n`);
  }
  const [composeEmailTitle, setComposeEmailTitle] = useState('Compose New Email');

  const handleSubmitWriteNewEmail = (event, details) => {
    setWriteNewEmailModalOpen(false);
    const outboundEmail = {
      from: currentUser.name,
      to: recipient.split(','),
      carbonCopy,
      subject,
      plain: emailBody,
      html: `<html><head/><body>${emailBody}</body></html>`,
      tags: [],
      labels: []};
    EventBus.dispatch(SET_LOADING, true);
    EmailService.sendEmail(outboundEmail) // get the current Folder content
        .then((res) => {
            if (res.status === 202) {
              toast.success("Email Sent successful");
              clearEmailForm();
            } else {
                toast.error("An error has occurred while sending Email!");
            }
            EventBus.dispatch(SET_LOADING, false);
        })
        .catch((err) => {
            toast.error("An error has occurred while sending Email!");
            if (DEBUG_MODE) console.log(err);
            clearEmailForm();
            EventBus.dispatch(SET_LOADING, false);
        });
    console.log("SENDING EMAIL", event, outboundEmail);
  }
  // Function to update the div width when the screen is resized
  const updateDivWidth = () => {
    if (divOfTableRef.current) {
      const width = divOfTableRef.current.offsetWidth;
      setDivWidth(Number(width));
    }
  };

  // Attach an event listener to the window's resize event
  useEffect(() => {
    window.addEventListener(RESIZED_WINDOW, updateDivWidth);
    // Call the function initially to get the initial width
    updateDivWidth();
    // Clean up the event listener when the component unmounts
    return () => {
      window.removeEventListener(RESIZED_WINDOW, updateDivWidth);
    };
  }, []);

  useEffect(() => {
    function onMouseMove(e) {
      if (!divOfTableRef.current) return;
      updateDivWidth();
    }
    window.addEventListener(MOUSE_MOVE, onMouseMove );
    return () => {
      window.removeEventListener(MOUSE_MOVE, onMouseMove);
    };
  }, []);

    useEffect(() => {
        EventBus.dispatch(SET_LOADING, true);
        EmailService.retrieveAllEmailsInFolder(currentFolder) // get the current Folder content
            .then((res) => {
                if (res.status === 200) {
                    console.log("LIST ALL EMAILS", res.data);
                    setEmails(res.data);
                } else if (res.status === 204) {
                    toast.error("There is no incoming email yet!");
                    setEmails([]);
                } else {
                    toast.error("An error has ocurred while getting mailbox content!");
                    setEmails([]);
                }
                EventBus.dispatch(SET_LOADING, false);
            })
            .catch((err) => {
                toast.error("An error has ocurred while getting mailbox content!");
                if (DEBUG_MODE) console.log(err);
                setEmails([]);
                EventBus.dispatch(SET_LOADING, false);
            })
        },[emails.length, currentFolder]);

    const emailSelectedHandler = (
      params, // GridRowParams
      event, // MuiEvent<React.MouseEvent<HTMLElement>>
      details, // GridCallbackDetails
    ) => {
      console.log(`Email "${params.row.id}" clicked`);
      setCurrentEmail(params.row);
    };

    const deleteEmailHandler = (event, details) => {
        console.log("DELETE ", event, details);
    }
  const handleDownloadEmail = () => {}
  const handleLabelEmail = () => {}

  return (
    <div className="w-full flex flex-col ">
      <div
        className="w-full flex justify-between items-center h-[60px] border-b border-b-[#dee0e4] fixed bg-white z-10 fill-white            "
        ref={divOfTableRef}
      >
        <div className="flex  justify-start ml-4 text-[14px] min-w-[400px] select-none ">
          <a className="flex border-r-[2px] border-[#dee0e4] gap-2 px-4 cursor-pointer" onClick={handleOpenWriteNewEmail}>
            <img src="/image/PlusFMCreateButton.svg" className="w-[20px] h-[20px] cursor-pointer" alt="Write New" />
            Write New
          </a>
          {divWidth <= 730 ? (
            <></>
          ) : (
            <>
              <a className={currentEmail ? "email-button-active" : "email-button-disabled"}
                 onClick={handleOpenReplyToEmail}>
                <img src="/image/icon-left.png" className="w-[20px] h-[20px] cursor-pointer" alt="Reply To" />
                Reply
              </a>

              <a className={currentEmail ? "email-button-active" : "email-button-disabled"}
                 onClick={handleOpenForwardToEmail}>
                <img src="/image/icon-right.png" className="w-[19px] h-[19px] cursor-pointer" alt="Forward" />
                Forward
              </a>
              <a className={currentEmail ? "email-button-active" : "email-button-disabled"}
                 onClick={handleDownloadEmail}>
                <img src="/image/FMDownloadIcon.svg" className="w-[20px] h-[20px] cursor-pointer" alt="Download" />
                Download
              </a>
              <a className={currentEmail ? "email-button-active" : "email-button-disabled"}
                 onClick={handleLabelEmail}>
                <img src="/image/FMStarIcon.svg" className="w-[20px] h-[20px] cursor-pointer" alt="Label email" />
                Label
              </a>
            </>
          )}
          <a className={currentEmail ? "email-button-active" : "email-button-disabled"} onClick={deleteEmailHandler}>
            <img src="/image/FMTrashIcon.svg" className="w-[20px] h-[20px]" alt="Trash email" />
            Delete
          </a>
        </div>
      </div>
      <div className={`w-full px-4 flex justify-center  font-roboto mt-[60px]`}>
        <DataGrid
          rows={emails}
          columns={columns}
          pageSize={25}
          rowHeight={30}
          columnHeaderHeight={40}
//          checkboxSelection
          onRowClick={emailSelectedHandler}
          sx={{
            borderLeft: "none",
            borderRight: "none",
            borderTop: "none",
          }}
          components={{
            ColumnSortedAscendingIcon: () => (
              <img src={"/image/down.png"} className="w-4 h-4" alt="Ascending" />
            ),
            ColumnSortedDescendingIcon: () => (
              <img src={"/image/up.png"} className="w-4 h-4" alt="Descending" />
            ),
          }}
        />
      </div>
      <Modal
        open={writeNewEmailModalOpen}
        id="write-new-email"
        onClose={handleCloseWriteNewEmail}
        aria-labelledby="modal-write-new-email-title"
        aria-describedby="modal-write-new-email-description"
      >
        <Box sx={modalStyle}>
          <Typography id="modal-write-new-email-title" variant="h6" component="h2">
            {composeEmailTitle}
          </Typography>
          <Typography id="modal-write-new-email-description" sx={{ mt: 2, mb: 2 }}>
            From:  {currentUser.name}
          </Typography>
          <form onSubmit={handleSubmitWriteNewEmail}>
            <Stack spacing={2} direction="row" sx={{marginBottom: 4}}>
                <TextField
                    type="email"
                    size="small"
                    variant='outlined'
                    color='primary'
                    label="To"
                    onChange={e => setRecipient(e.target.value)}
                    value={recipient}
                    fullWidth
                    required
                />
                <TextField
                    type="email"
                    size="small"
                    variant='outlined'
                    color='secondary'
                    label="CC"
                    onChange={e => setCarbonCopy(e.target.value)}
                    value={carbonCopy}
                    fullWidth
                />
            </Stack>
            <TextField
                type="text"
                size="small"
                variant='outlined'
                color='secondary'
                label="Subject"
                onChange={e => setSubject(e.target.value)}
                value={subject}
                fullWidth
                required
                sx={{mb: 4}}
            />
            <TextField
                type="text"
                variant='outlined'
                color='secondary'
                label="Message"
                onChange={e => setEmailBody(e.target.value)}
                value={emailBody}
                required
                fullWidth
                multiline
                sx={{mb: 4}}
            />
            <div className="flex justify-end">
              <Button type="submit">Send</Button>
              <Button type="submit">Save</Button>
              <Button type="button" onClick={handleCloseWriteNewEmail}>Cancel</Button>
            </div>
          </form>
        </Box>
      </Modal>
    </div>
  );
};

export default EmailMiddlePanel;
