import { ViewIcon, CloseIcon, SmallAddIcon, EditIcon } from "@chakra-ui/icons";
import {
  Button,
  useDisclosure,
  FormControl,
  Input,
  useToast,
  Box,
  IconButton,
  Text,
  Spinner,
  Image,
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Stack,
} from "@chakra-ui/react";
import axios from "axios";
import { useState } from "react";
import { ChatState } from "../../Context/ChatProvider";
import UserListItem from "../userAvatar/UserListItem";
import ExistGroupUserListItem from "../userAvatar/existGroupUserListItem";
import React from "react";

const UpdateGroupChatModal = ({ fetchMessages, fetchAgain, setFetchAgain }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isOpenImage,
    onOpen: onOpenImage,
    onClose: onCloseImage,
  } = useDisclosure();
  const btnRef = React.useRef();

  const [groupChatName, setGroupChatName] = useState();
  const [search, setSearch] = useState("");
  const [searchResult, setSearchResult] = useState([]);
  const [loading, setLoading] = useState(false);
  const [renameloading, setRenameLoading] = useState(false);
  const toast = useToast();

  const { selectedChat, setSelectedChat, user } = ChatState();

  const handleSearch = async (search) => {
    console.log(search);
    if (!search) {
      return;
    }

    try {
      setLoading(true);
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      const { data } = await axios.get(`/api/user?search=${search}`, config);

      setLoading(false);
      setSearchResult(data);
    } catch (error) {
      toast({
        title: "Error Occured!",
        description: "Failed to Load the Search Results",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom-left",
      });
      setLoading(false);
    }
  };

  const handleRename = async () => {
    if (!groupChatName) return;

    try {
      setRenameLoading(true);
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      const { data } = await axios.put(
        `/api/chat/rename`,
        {
          chatId: selectedChat._id,
          chatName: groupChatName,
        },
        config
      );

      setSelectedChat(data);
      setFetchAgain(!fetchAgain);
      setRenameLoading(false);
    } catch (error) {
      toast({
        title: "Error Occured!",
        description: error.response.data.message,
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
      setRenameLoading(false);
    }
    setGroupChatName("");
  };

  const handleAddUser = async (user1) => {
    if (selectedChat.users.find((u) => u._id === user1._id)) {
      toast({
        title: "User Already in group!",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
      return;
    }
    if (!selectedChat.groupAdmin.some((admin) => admin._id === user._id)) {
      toast({
        title: "Only admins can add someone!",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
      return;
    }

    try {
      setLoading(true);
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      const { data } = await axios.put(
        `/api/chat/groupadd`,
        {
          chatId: selectedChat._id,
          userId: user1._id,
        },
        config
      );
      setSearch("");
      setSearchResult([]);
      setSelectedChat(data);
      setFetchAgain(!fetchAgain);
      setLoading(false);
    } catch (error) {
      toast({
        title: "Error Occured!",
        description: error.response.data.message,
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
      setLoading(false);
    }
    setGroupChatName("");
  };

  const handleRemove = async (user1) => {
    if (selectedChat.groupOwner._id === user1._id) {
      if (selectedChat.groupOwner._id === user._id) {
        toast({
          title: "You cannot remove youself until transfer group ownership!",
          status: "error",
          duration: 5000,
          isClosable: true,
          position: "bottom",
        });
        return;
      } else {
        toast({
          title: "You cant remove Group Owner!",
          status: "error",
          duration: 5000,
          isClosable: true,
          position: "bottom",
        });
        return;
      }
    }

    if (
      !selectedChat.groupAdmin.some((admin) => admin._id === user._id) &&
      !selectedChat.groupAdmin.some((admin) => admin._id === user1._id)
    ) {
      toast({
        title: "Only admins can remove someone!",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
      return;
    }

    try {
      setLoading(true);
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      const { data } = await axios.put(
        `/api/chat/groupremove`,
        {
          chatId: selectedChat._id,
          userId: user1._id,
        },
        config
      );

      setSelectedChat(data);
      setFetchAgain(!fetchAgain);
      fetchMessages();
      setLoading(false);
    } catch (error) {
      toast({
        title: "Error Occured!",
        description: error.response.data.message,
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
      setLoading(false);
    }
    setGroupChatName("");
  };

  const AddToGroupAdmin = async (user1) => {
    if (selectedChat.groupAdmin.some((admin) => admin._id === user1._id)) {
      toast({
        title: "User is already an admin!",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
      return;
    }
    if (!selectedChat.groupAdmin.some((admin) => admin._id === user._id)) {
      toast({
        title: "Only Group Owner can add Admin!",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
      return;
    }

    try {
      setLoading(true);
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      const { data } = await axios.put(
        `/api/chat/groupaddadmin`,
        {
          chatId: selectedChat._id,
          userId: user1._id,
        },
        config
      );

      setSelectedChat(data);
      setFetchAgain(!fetchAgain);
      setLoading(false);
    } catch (error) {
      toast({
        title: "Error Occured!",
        description: error.response.data.message,
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
      setLoading(false);
    }
  };

  const RemoveToGroupAdmin = async (user1) => {
    if (selectedChat.groupOwner._id === user1._id) {
      toast({
        title: "You cannot remove Group Owner!",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
      return;
    }

    if (
      !selectedChat.groupAdmin.some((admin) => admin._id === user._id) &&
      !selectedChat.groupAdmin.some((admin) => admin._id === user1._id)
    ) {
      toast({
        title: "Only admins can remove someone!",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
      return;
    }

    try {
      setLoading(true);
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      const { data } = await axios.put(
        `/api/chat/groupremoveadmin`,
        {
          chatId: selectedChat._id,
          userId: user1._id,
        },
        config
      );

      setSelectedChat(data);
      setFetchAgain(!fetchAgain);
      setLoading(false);
    } catch (error) {
      toast({
        title: "Error Occured!",
        description: error.response.data.message,
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
      setLoading(false);
    }
  };

  const [pic, setPic] = useState();
  const [picLoading, setPicLoading] = useState(false);

  const handleImageUpload = (event) => {
    const pics = event.target.files[0];
    setPicLoading(true);
    if (pics === undefined) {
      toast({
        title: "Please Select an Image!",
        status: "warning",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
      return;
    }

    if (pics.type === "image/jpeg" || pics.type === "image/png") {
      const data = new FormData();
      data.append("file", pics);
      data.append("upload_preset", "chat-app");
      data.append("cloud_name", "djn1nfuky");
      fetch("https://api.cloudinary.com/v1_1/djn1nfuky/image/upload", {
        method: "post",
        body: data,
      })
        .then((res) => res.json())
        .then((data) => {
          setPic(data.url.toString());

          setPicLoading(false);
        })
        .catch((err) => {
          console.log(err);
          setPicLoading(false);
        });
    } else {
      toast({
        title: "Please Select an Image!",
        status: "warning",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
      setPicLoading(false);
      return;
    }
  };

  const handleGroupImageUpload = async () => {
    if (!pic) return;

    try {
      setPicLoading(true);
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      const { data } = await axios.put(
        `/api/chat/rename`,
        {
          chatId: selectedChat._id,
          pic: pic,
        },
        config
      );

      setSelectedChat(data);
      setFetchAgain(!fetchAgain);
      setPicLoading(false);
    } catch (error) {
      toast({
        title: "Error Occured!",
        description: error.response.data.message,
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
      setPicLoading(false);
    }
  };

  return (
    <>
      <IconButton d={{ base: "flex" }} icon={<ViewIcon />} onClick={onOpen} />

      <Drawer
        isOpen={isOpen}
        placement="right"
        onClose={onClose}
        finalFocusRef={btnRef}
        size="md"
      >
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <Box
            d="flex"
            justifyContent="center"
            alignItems="center"
            w="100%"
            pt={10}
          >
            <Image
              borderRadius="full"
              boxSize="110px"
              src={selectedChat.pic}
              alt={selectedChat.chatname}
            />
          </Box>
          <Box
            d="flex"
            justifyContent="center"
            alignItems="center"
            w="100%"
            pl={100}
            my={-4}
            // onClick={onOpenImage}
          >
            <IconButton
              aria-label="Search database"
              icon={<EditIcon />}
              onClick={onOpenImage}
              size="xs"
            />
          </Box>
          <Modal isOpen={isOpenImage} onClose={onCloseImage}>
            <ModalOverlay />
            <ModalContent>
              <ModalHeader>Upload Image</ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                <input type="file" onChange={handleImageUpload} />
                <Box
                  my={4}
                  w="100%"
                  d="flex"
                  justifyContent="center"
                  alignItems="center"
                >
                  {pic && <img src={pic} alt="Selected" />}
                </Box>
              </ModalBody>

              <ModalFooter>
                <Button colorScheme="blue" mr={3} onClick={onCloseImage}>
                  Close
                </Button>
                <Button
                  variant="ghost"
                  isLoading={picLoading}
                  onClick={() => {
                    handleGroupImageUpload();
                    onCloseImage();
                  }}
                >
                  Update
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
          <DrawerHeader
            fontSize="35px"
            fontFamily="Work sans"
            d="flex"
            justifyContent="center"
          >
            {selectedChat.chatName}
          </DrawerHeader>

          <DrawerBody d="flex" flexDir="column" alignItems="center">
            <Text fontStyle="italic" w="100%" pl={3} pb={2} color="#7e7e7e">
              Created by{" "}
              {selectedChat.groupOwner._id === user._id
                ? "You"
                : selectedChat.groupOwner.name}
              , {selectedChat.createdAt.slice(0, 10)}
            </Text>

            <FormControl d="flex">
              <Input
                placeholder="Chat Name"
                mb={3}
                value={groupChatName}
                onChange={(e) => setGroupChatName(e.target.value)}
              />
              <Button
                variant="solid"
                colorScheme="teal"
                ml={1}
                isLoading={renameloading}
                onClick={handleRename}
              >
                Update
              </Button>
            </FormControl>
            <FormControl>
              <Input
                placeholder="Add User to group"
                mb={1}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  handleSearch(search);
                }}
              />
            </FormControl>
            {search.length > 0 && (
              <Box d="flex" w="100%" px={3} py={3}>
                <CloseIcon
                  boxSize={2}
                  onClick={() => {
                    setSearch("");
                    setSearchResult([]);
                  }}
                />
              </Box>
            )}
            {loading ? (
              <Spinner size="lg" />
            ) : (
              <>
                {searchResult?.map((searchUser) => (
                  <UserListItem
                    key={searchUser._id}
                    user={searchUser}
                    handleFunction={() => handleAddUser(searchUser)}
                  />
                ))}
              </>
            )}
            <Text
              w="100%"
              textAlign="start"
              pl={3}
              color="#7e7e7e"
              fontStyle="italic"
              my={2}
            >
              {selectedChat && selectedChat.users.length} participant
              {selectedChat.length !== 1 ? "s" : ""}
            </Text>

            {selectedChat.users
              .filter(
                (u) =>
                  !selectedChat.groupAdmin.some((admin) => admin._id === u._id)
              )
              .concat(
                selectedChat.users.filter((u) =>
                  selectedChat.groupAdmin.some((admin) => admin._id === u._id)
                )
              )
              .reverse()
              .map((u) => (
                <ExistGroupUserListItem
                  key={u._id}
                  useringroup={u}
                  admin={selectedChat.groupAdmin}
                  handleRemoveFunction={() => handleRemove(u)}
                  handleAddToGroupAdminFunction={() => AddToGroupAdmin(u)}
                  handleRemoveToGroupAdminFunction={() => RemoveToGroupAdmin(u)}
                />
              ))}
          </DrawerBody>
          <DrawerFooter>
            <Button onClick={() => handleRemove(user)} colorScheme="red">
              Leave Group
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default UpdateGroupChatModal;
