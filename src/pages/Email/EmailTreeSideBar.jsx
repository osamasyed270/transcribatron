import { TreeView } from "@mui/x-tree-view/TreeView";
import { TreeItem } from "@mui/x-tree-view/TreeItem";
//import { makeStyles } from "@mui/styles";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import FolderIcon from "@mui/icons-material/Folder";
import FileIcon from "@mui/icons-material/FilePresent";
import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import "./email-styles.css";
import ConfirmationDialog from "@/Components/ConfirmationDialog";
import { toast } from "react-hot-toast";
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import { SET_LOADING, DEBUG_MODE } from "@/utils/Constant";
import { EventBus } from "@/utils/Functions";
import EmailService from "@/services/email";
import EmailAdminService from "@/services/emailAdmin";

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

const useStyles = () => {
  root: {
    height: 240;
    flexGrow: 1;
    maxWidth: 400;
  };
  listItem: {
    display: "flex";
    alignItems: "center";
    padding: "8px 0 8px 0"
  };
};

const MyTreeView = ({ treeData, onDragEnd, currentFolder, setCurrentFolder, mailboxFolders }) => {
  const classes = {};//useStyles();

  const handleNodeClick = (event, nodeId) => {
    // nodeIds will contain the ids of the clicked node
    if (nodeId !== currentFolder) {
        console.log('Node clicked:', nodeId);
        setCurrentFolder(nodeId);
    }
  };

  return (
            <TreeView
              className="email-list-root"
              defaultCollapseIcon={<ExpandMoreIcon sx={{ fill: "#4489fe" }} />}
              defaultExpandIcon={<ChevronRightIcon sx={{ fill: "#4489fe" }} />}
              onNodeFocus={handleNodeClick}
              >
              {mailboxFolders.map(folder => {
                              return (<TreeItem nodeId={folder}
                                    key={folder}
                                    label={folder}
                                    icon={folder === "Inbox" ?
                                      (<img src="/image/FMHomeIcon.svg" className="w-[18px] h-[18px]" alt="home icon" />) :
                                      (<FolderIcon sx={{ width: "18px", height: "18px", fill: "#4489fe" }}/>)
                                      }
                              />);
            })}
            </TreeView>
  );
};


const EmailTreeSideBar = (props) => {
  const DEFAULT_MAILBOX_FOLDERS = ["Inbox", "Sent", "Drafts", "Trash"];
  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.admin.currentUser);
  console.log("EmailTreeSideBar currentUser", currentUser);
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [createFolderModalOpen, setCreateFolderModalOpen] = useState(false);
  const { showOrHide, currentFolder, setCurrentFolder } = props;
  const handleDragEnd = (result) => {
    // Implement logic to update tree structure based on drag-and-drop actions
    // result.source.index and result.destination.index can be used to determine the new order.
    console.log("handle drag end result >>> ", result);
  };
  const handleDeleteFolderConfirmation = (decision) => {
    if (decision) {
      EventBus.dispatch(SET_LOADING, true);
      dispatch({type: 'admin/removeFolder', payload: currentFolder});
      EmailService.deleteAllEmailsInFolder(currentFolder, {userId: currentUser.name})
        .then((res) => {
             if (res.status === 200) {
             } else {
                 toast.error("An error has occurred while deleting folder!");
             }
             EventBus.dispatch(SET_LOADING, false);
         })
         .catch((err) => {
             toast.error("An error has occurred while deleting folder!");
             if (DEBUG_MODE) console.log(err);
             clearEmailForm();
             EventBus.dispatch(SET_LOADING, false);
         });
    }
    setConfirmationDialogOpen(false);
  }
  const [confirmationDialogOpen, setConfirmationDialogOpen] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const [newFolderName, setNewFolderName] = useState('');

  const handleRequestCreateFolder = () => {
    setCreateFolderModalOpen(true);
  }

  const handleRequestRemoveFolder = () => {
    if (!currentFolder || DEFAULT_MAILBOX_FOLDERS.includes(currentFolder)) {
      toast.error("Cannot remove the default folder.");
    } else {
      setConfirmationText(`You are about to remove folder [${currentFolder}]. If it contains any message(s), those will be moved to Trash. This action cannot be undone. Proceed?`);
      setConfirmationDialogOpen(true);
    }
    setShowPlusMenu(false);
  }

  const handleCloseCreateFolder = () => {
    setCreateFolderModalOpen(false);
    setNewFolderName('');
    setShowPlusMenu(false);
  }

  const handleSubmitCreateFolder = () => {
    handleCloseCreateFolder();
    EventBus.dispatch(SET_LOADING, false);
    if (newFolderName && newFolderName !== '') {
      if (currentUser.folders.includes(newFolderName)) {
        toast.error(`The folder [${newFolderName}] already exists!`);
      } else {
        dispatch({type: 'admin/addFolder', payload: newFolderName});
        EmailAdminService.updateUser({...currentUser, folders: [...currentUser.folders, newFolderName]})
          .then((res) => {
               if (res.status === 200) {
               } else {
                   toast.error("An error has occurred while updating user with new folder!");
               }
               EventBus.dispatch(SET_LOADING, false);
           })
           .catch((err) => {
               toast.error("An error has occurred while deleting folder!");
               if (DEBUG_MODE) console.log(err);
               clearEmailForm();
               EventBus.dispatch(SET_LOADING, false);
           });
      }
    }
    setShowPlusMenu(false);
  }

  return (
    <div
      className={`w-full flex-col pl-4 relative ${showOrHide === true ? "pl-4" : "pl-0"}`}
      style={{ display: `${showOrHide === true ? "flex relative" : "none"}` }}
    >
      <div className="z-50 absolute -top-[23px] right-[46px] select-none cursor-pointer">
        <button
          className="flex items-center justify-center h-[46px] w-[46px] rounded-full shadow-md hover:shadow-lg select-none"
          onClick={() => setShowPlusMenu(!showPlusMenu)}
        >
          <img src="/image/plus-svgrepo-com.svg" className="w-full h-full select-none" alt="plus" />
        </button>

        {showPlusMenu === true && (
          <div
            className=" w-[240px] absolute  left-[24px] top-[24px] flex flex-col gap-3 bg-white shadow-md
            border-[1px] border-[#E5E9EE] rounded-[4px] text-[16px] font-medium"
          >
            <div className="w-[240px] flex flex-col cursor-pointer py-4 ">
              <a className="flex flex-start pl-5 items-center" onClick={handleRequestCreateFolder}>
                <img src="/image/FMNewFolderIcon.svg" className="w-5 h-5 mr-2" alt="folder" />
                Create Folder
              </a>
              <div className="flex justify-center mt-3">
                <div className="w-[200px] border-b-[1px] border-[#C4C4C4]"></div>
              </div>
            </div>
            <a
              className="w-[240px] flex flex-col cursor-pointer  pb-4 "
              onClick={handleRequestRemoveFolder}
            >
              <div className="flex flex-start pl-5 items-center">
                <img src="/image/FMNewFileIcon.svg" className="w-5 h-5 mr-2" alt="folder"
                />
                Remove Folder
              </div>
            </a>
          </div>
        )}
      </div>
      <div className="absolute  bottom-0 right-0 left-5 top-0 flex flex-col  mt-3  h-[calc(100vh-160px)] overflow-y-auto">
        <div className="text-[#212121] mt-5  font-bold">{currentUser.name}</div>
        <MyTreeView onDragEnd={handleDragEnd} currentFolder={currentFolder} setCurrentFolder={setCurrentFolder} mailboxFolders={currentUser.folders}/>
      </div>
      <Modal
        open={createFolderModalOpen}
        id="write-new-email"
        onClose={handleCloseCreateFolder}
        aria-labelledby="modal-write-new-email-title"
        aria-describedby="modal-write-new-email-description"
      >
        <Box sx={modalStyle}>
          <Typography id="modal-write-new-email-title" variant="h6" component="h2">
            Create Folder
          </Typography>
          <Typography id="modal-write-new-email-description" sx={{ mt: 2, mb: 2 }}>
            Mailbox:  {currentUser.name}
          </Typography>
          <form onSubmit={handleSubmitCreateFolder}>
            <TextField
                type="text"
                variant='outlined'
                color='primary'
                label="Folder Name"
                onChange={e => setNewFolderName(e.target.value)}
                value={newFolderName}
                required
                fullWidth
                sx={{mb: 4}}
            />
            <div className="flex justify-end">
              <Button type="submit">Create</Button>
              <Button type="button" onClick={handleCloseCreateFolder}>Cancel</Button>
            </div>
          </form>
        </Box>
      </Modal>
      <ConfirmationDialog
        id="folder-confirm-action"
        keepMounted
        open={confirmationDialogOpen}
        onClose={(decision) => handleDeleteFolderConfirmation(decision)}
        dialogText={confirmationText}
        dialogTitle="Remove Folder Confirmation"
      />
    </div>
  );
};

export default EmailTreeSideBar;
