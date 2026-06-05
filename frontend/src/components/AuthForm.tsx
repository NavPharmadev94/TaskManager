"use client";

import { Box, Button, Heading, Input, Link as ChakraLink, Stack, Text } from "@chakra-ui/react";
import Link from "next/link";
import { useState } from "react";

interface AuthFormProps {
  heading: string;
  submitLabel: string;
  onSubmit: (email: string, password: string) => Promise<void>;
  footerText: string;
  footerLinkLabel: string;
  footerLinkHref: string;
}

export function AuthForm({
  heading,
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
    <Box minH="100vh" display="flex" alignItems="center" justifyContent="center" bg="gray.50">
      <Box
        as="form"
        onSubmit={handleSubmit}
        bg="white"
        p={8}
        rounded="xl"
        shadow="md"
        w="full"
        maxW="400px"
      >
        <Stack gap={5}>
          <Heading size="lg" textAlign="center">
            {heading}
          </Heading>

          <Box>
            <Text mb={1} fontSize="sm" fontWeight="medium">
              Email
            </Text>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </Box>

          <Box>
            <Text mb={1} fontSize="sm" fontWeight="medium">
              Password
            </Text>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </Box>

          {error && (
            <Text color="red.500" fontSize="sm">
              {error}
            </Text>
          )}

          <Button type="submit" colorPalette="blue" loading={loading} w="full">
            {submitLabel}
          </Button>

          <Text fontSize="sm" textAlign="center" color="gray.500">
            {footerText}{" "}
            <ChakraLink asChild color="blue.500">
              <Link href={footerLinkHref}>{footerLinkLabel}</Link>
            </ChakraLink>
          </Text>
        </Stack>
      </Box>
    </Box>
  );
}
