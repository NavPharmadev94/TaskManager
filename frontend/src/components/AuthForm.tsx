"use client";

import { Box, Button, Heading, Input, Link as ChakraLink, Stack, Text } from "@chakra-ui/react";
import Link from "next/link";
import { useState } from "react";

interface AuthFormProps {
  heading: string;
  subheading?: string;
  submitLabel: string;
  onSubmit: (email: string, password: string) => Promise<void>;
  footerText: string;
  footerLinkLabel: string;
  footerLinkHref: string;
}

export function AuthForm({
  heading,
  subheading,
  submitLabel,
  onSubmit,
  footerText,
  footerLinkLabel,
  footerLinkHref,
}: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await onSubmit(email, password);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box
      minH="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      bg="gray.50"
      px={4}
    >
      <Box w="full" maxW="420px">
        {/* Brand header */}
        <Stack align="center" mb={8} gap={1}>
          <Heading size="xl" fontWeight="bold" letterSpacing="tight">
            Task Manager
          </Heading>
          <Text color="gray.500" fontSize="sm">
            {subheading}
          </Text>
        </Stack>

        {/* Card */}
        <Box
          as="form"
          onSubmit={handleSubmit}
          bg="white"
          px={8}
          py={8}
          rounded="2xl"
          shadow="lg"
          borderWidth={1}
          borderColor="gray.100"
        >
          <Stack gap={5}>
            <Heading size="md" fontWeight="semibold">
              {heading}
            </Heading>

            <Stack gap={4}>
              <Box>
                <Text mb={2} fontSize="sm" fontWeight="medium" color="gray.700">
                  Email address
                </Text>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  size="lg"
                  px={4}
                  required
                />
              </Box>

              <Box>
                <Text mb={2} fontSize="sm" fontWeight="medium" color="gray.700">
                  Password
                </Text>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  size="lg"
                  px={4}
                  minLength={8}
                  required
                />
                <Text fontSize="xs" color="gray.400" mt={1}>
                  Minimum 8 characters
                </Text>
              </Box>
            </Stack>

            {error && (
              <Box bg="red.50" border="1px solid" borderColor="red.200" rounded="lg" px={4} py={3}>
                <Text color="red.600" fontSize="sm">
                  {error}
                </Text>
              </Box>
            )}

            <Button
              type="submit"
              colorPalette="blue"
              loading={loading}
              w="full"
              size="lg"
              mt={1}
            >
              {submitLabel}
            </Button>

            <Text fontSize="sm" textAlign="center" color="gray.500">
              {footerText}{" "}
              <ChakraLink asChild color="blue.500" fontWeight="medium">
                <Link href={footerLinkHref}>{footerLinkLabel}</Link>
              </ChakraLink>
            </Text>
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}

