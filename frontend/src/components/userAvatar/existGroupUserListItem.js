import { Avatar } from "@chakra-ui/avatar";
import { Box, Text } from "@chakra-ui/layout";
import { ChatState } from "../../Context/ChatProvider";
import { SmallAddIcon } from "@chakra-ui/icons";
import { Badge } from "@chakra-ui/react";
const ExistGroupUserListItem = ({ admin, useringroup, handleFunction }) => {
  const { user } = ChatState();
  return (
    <Box
      //   onClick={handleFunction}
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
    >
      <Box ml={2} d="flex" alignItems="center" w="100%">
        <Avatar
          mr={2}
          size="sm"
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
            <Text fontSize="xs">
              <b>Email : </b>
              {useringroup.email}
            </Text>
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
      </Box>
      {admin.some((admin) => admin._id === user._id) && (
        <Box>
          <SmallAddIcon />
        </Box>
      )}
    </Box>
  );
};

export default ExistGroupUserListItem;
