import { extendTheme } from "@chakra-ui/react";

const config = {
    initialColorMode: "dark",
    useSystemColorMode: false,
};

const styles = {
    global: (props) => ({
        body: {
            fontFamily: "'Inter', sans-serif",
            bg: "#0b141a", // Deep Black/Green
            color: "#e9edef", // Light Gray Text
            lineHeight: "base",
        },
        "::-webkit-scrollbar": {
            width: "6px",
        },
        "::-webkit-scrollbar-track": {
            background: "transparent",
        },
        "::-webkit-scrollbar-thumb": {
            background: "rgba(255, 255, 255, 0.2)",
            borderRadius: "3px",
        },
    }),
};

const colors = {
    brand: {
        500: "#00a884", // WhatsApp Teal Green
        600: "#008f6f",
    },
    dark: {
        bg: "#0b141a",
        panel: "#202c33", // Sidebar/Chat Header
        hover: "#2a3942",
        messageIn: "#202c33",
        messageOut: "#005c4b",
    },
};

const components = {
    Button: {
        baseStyle: {
            borderRadius: "md",
            fontWeight: "medium",
        },
        variants: {
            solid: {
                bg: "brand.500",
                color: "#111b21",
                _hover: {
                    bg: "brand.600",
                },
            },
            ghost: {
                color: "#aebac1",
                _hover: {
                    bg: "rgba(255, 255, 255, 0.05)",
                },
            },
        },
    },
    Input: {
        baseStyle: {
            field: {
                borderRadius: "md",
                bg: "#2a3942",
                border: "none",
                color: "#e9edef",
                _placeholder: {
                    color: "#8696a0",
                },
            },
        },
        variants: {
            filled: {
                field: {
                    bg: "#2a3942",
                    _hover: {
                        bg: "#2a3942",
                    },
                    _focus: {
                        bg: "#2a3942",
                        border: "none",
                    },
                },
            },
        },
    },
    Box: {
        variants: {
            panel: {
                bg: "#202c33",
                borderRight: "1px solid #374045",
            },
        },
    },
    Menu: {
        baseStyle: {
            list: {
                bg: "#233138",
                border: "none",
                color: "#d1d7db",
            },
            item: {
                bg: "transparent",
                _hover: {
                    bg: "#182229",
                },
                _focus: {
                    bg: "#182229",
                },
            },
        },
    },
    Modal: {
        baseStyle: {
            dialog: {
                bg: "#3b4a54",
                color: "#e9edef",
            },
        },
    },
};

const theme = extendTheme({ config, styles, colors, components });

export default theme;
