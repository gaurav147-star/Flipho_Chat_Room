import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  useDisclosure,
  IconButton,
  Text,
  Image,
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  Box,
  useToast,
} from "@chakra-ui/react";
import React, { useEffect } from "react";
import { useState } from "react";
import { ViewIcon, EditIcon } from "@chakra-ui/icons";
import axios from "axios";
import { ChatState } from "../../Context/ChatProvider";

const MineprofileModal = ({ user, children, fetchAgain, setFetchAgain }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isOpenImage,
    onOpen: onOpenImage,
    onClose: onCloseImage,
  } = useDisclosure();
  const btnRef = React.useRef();
  const [pic, setPic] = useState();
  const [updatePic, setUpdatepic] = useState();

  const [picLoading, setPicLoading] = useState(false);
  useEffect(() => {}, [updatePic]);

  const toast = useToast();

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
        `/api/user/updatepic`,
        {
          userId: user._id,
          pic: pic,
        },
        config
      );

      setUpdatepic(data.pic);
      const userInfo = localStorage.getItem("userInfo");

      if (userInfo) {
        const parsedUserInfo = JSON.parse(userInfo);
        const updatedUserInfo = { ...parsedUserInfo, ...data };
        localStorage.setItem("userInfo", JSON.stringify(updatedUserInfo));
      } else {
        localStorage.setItem("userInfo", JSON.stringify(data));
      }

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
      {children ? (
        <span onClick={onOpen}>{children}</span>
      ) : (
        <IconButton d={{ base: "flex" }} icon={<ViewIcon />} onClick={onOpen} />
      )}

      <Drawer
        isOpen={isOpen}
        placement="right"
        onClose={onClose}
        finalFocusRef={btnRef}
        size="sm"
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
              src={updatePic ? updatePic : user.pic}
              alt={user.name}
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
            fontFamily="Work sans"
            d="flex"
            justifyContent="center"
            flexDirection="column"
            alignItems="center"
            pt={10}
          >
            <Box fontSize="35px">{user.name}</Box>
            <Box> {user.email}</Box>
          </DrawerHeader>

          <DrawerBody d="flex" flexDir="column" alignItems="center">
            <Text
              fontStyle="italic"
              w="100%"
              pl={3}
              pb={2}
              color="#7e7e7e"
            ></Text>
          </DrawerBody>
          <DrawerFooter></DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default MineprofileModal;
