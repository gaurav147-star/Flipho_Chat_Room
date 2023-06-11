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
import { ViewIcon } from "@chakra-ui/icons";

const ProfileModal = ({ user, children }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const btnRef = React.useRef();
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

export default ProfileModal;
