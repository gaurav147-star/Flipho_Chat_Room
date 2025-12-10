import {
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
} from "@chakra-ui/react";
import React from "react";
import { ViewIcon, EditIcon } from "@chakra-ui/icons";
import { useState } from "react";
import axios from "axios";
import { useToast, Button, Input, FormControl, FormLabel } from "@chakra-ui/react";

const ProfileModal = ({ user, children }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const btnRef = React.useRef();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [pic, setPic] = useState(user.pic);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleUpdate = async () => {
    setLoading(true);
    try {
      const userInfo = JSON.parse(localStorage.getItem("userInfo"));
      const config = {
        headers: {
          "Content-type": "application/json",
          Authorization: `Bearer ${userInfo.token}`,
        },
      };
      const { data } = await axios.put(
        "/api/user/update",
        { userId: user._id, name, pic },
        config
      );

      localStorage.setItem("userInfo", JSON.stringify(data));
      setLoading(false);
      setIsEditing(false);
      toast({
        title: "Profile Updated",
        status: "success",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
      window.location.reload(); // Force reload to reflect changes everywhere
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
        import SideDrawer from "../components/miscellaneous/SideDrawer";
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
              src={user.pic}
              alt={user.name}
            />
          </Box>

          <DrawerHeader
            fontFamily="Work sans"
            d="flex"
            justifyContent="center"
            flexDirection="column"
            alignItems="center"
            pt={10}
          >
            {isEditing ? (
              <FormControl>
                <Input
                  placeholder="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  mb={2}
                  color="white"
                />
                <Input
                  placeholder="Pic URL"
                  value={pic}
                  onChange={(e) => setPic(e.target.value)}
                  color="white"
                />
              </FormControl>
            ) : (
              <>
                <Box fontSize="35px">{name}</Box>
                <Box> {user.email}</Box>
              </>
            )}
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
          <DrawerFooter>
            {isEditing ? (
              <Button colorScheme="blue" mr={3} onClick={handleUpdate} isLoading={loading}>
                Save
              </Button>
            ) : (
              <Button variant="ghost" mr={3} onClick={() => setIsEditing(true)}>
                <EditIcon /> Edit
              </Button>
            )}
            {isEditing && <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>}
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default ProfileModal;
