import { Avatar } from "@chakra-ui/avatar";
import { Box, Text } from "@chakra-ui/layout";
import { ChatState } from "../../Context/ChatProvider";
import { useState } from "react";
import {
  SmallAddIcon,
  SmallCloseIcon,
  ChevronDownIcon,
} from "@chakra-ui/icons";
import {
  Badge,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
} from "@chakra-ui/react";
const ExistGroupUserListItem = ({
  admin,
  useringroup,
  handleRemoveFunction,
  handleAddToGroupAdminFunction,
  handleRemoveToGroupAdminFunction,
}) => {
  const { user, setSelectedChat } = ChatState();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Box
      cursor="pointer"
      bg="#E8E8E8"
      _hover={{
        background: "#38B2AC",
        color: "white",
      }}
      w="100%"
      d="flex"
      alignItems="center"
      color="black"
      px={3}
      py={2}
      mb={2}
      borderRadius="lg"
      justifyContent="space-between"
      pos="relative"
    >
      <Box ml={2} d="flex" alignItems="center" w="100%">
        <Avatar
          mr={2}
          size="md"
          cursor="pointer"
          name={useringroup.name}
          src={useringroup.pic}
        />
        <Box
          w="100%"
          d="flex"
          alignItems="center"
          justifyContent="space-between"
        >
          <Box>
            <Text>{useringroup.name}</Text>
          </Box>
          {admin.some((admin) => admin._id === useringroup._id) && (
            <Badge
              ml="3"
              colorScheme="green"
              mr={3}
              px={2}
              py={1}
              borderRadius="lg"
            >
              Chat Admin
            </Badge>
          )}
        </Box>
        {admin.some((admin) => admin._id === user._id) && (
          <>
            <Box onClick={() => setIsOpen(!isOpen)}>
              {!isOpen ? <SmallAddIcon /> : <SmallCloseIcon />}
            </Box>
            {isOpen && (
              <Box
                pos="absolute"
                right="7"
                top="10"
                bg="#fff"
                color="#000"
                d="flex"
                flexDirection="column"
                zIndex="100"
                borderRadius="md"
                gap={3}
                py={3}
                px={5}
                fontSize={16}
              >
                <Box
                  variant="link"

                  // onClick={() => setSelectedChat(useringroup)}
                >
                  Message {useringroup.name}
                </Box>
                {!admin.some((admin) => admin._id === useringroup._id) ? (
                  <Box
                    variant="link"
                    onClick={() => {
                      handleAddToGroupAdminFunction();
                      setIsOpen(!isOpen);
                    }}
                  >
                    Make group admin
                  </Box>
                ) : (
                  <Box
                    variant="link"
                    onClick={() => {
                      handleRemoveToGroupAdminFunction();
                      setIsOpen(!isOpen);
                    }}
                  >
                    Dismiss as admin
                  </Box>
                )}

                <Box
                  variant="link"
                  onClick={() => {
                    handleRemoveFunction();
                    setIsOpen(!isOpen);
                  }}
                >
                  Remove {useringroup.name}
                </Box>
              </Box>
            )}
          </>
        )}
      </Box>
    </Box>
  );
};

export default ExistGroupUserListItem;
