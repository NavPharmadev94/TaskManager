"use client";

import {
  Badge,
  Box,
  Button,
  Heading,
  HStack,
  Input,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createTask, getMe, getTasks, logout, type Task, type User } from "@/lib/api";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState("");
  const [addError, setAddError] = useState("");
  const [adding, setAdding] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        const u = await getMe();
        if (cancelled) return;
        setUser(u);
        const data = await getTasks();
        if (!cancelled) setTasks(data);
      } catch {
        if (!cancelled) router.replace("/login");
      }
    }
    init();
    return () => { cancelled = true; };
  }, [router]);

  async function handleAddTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTask.trim()) return;
    setAddError("");
    setAdding(true);
    try {
      const task = await createTask(newTask.trim());
      setTasks((prev) => [task, ...prev]);
      setNewTask("");
    } catch (err: unknown) {
      setAddError(err instanceof Error ? err.message : "Failed to add task");
    } finally {
      setAdding(false);
    }
  }

  async function handleLogout() {
    setLoggingOut(true);
    await logout();
    router.replace("/login");
  }

  if (!user) return null;

  const pending = tasks.filter((t) => !t.completed).length;

  return (
    <Box minH="100vh" bg="gray.50">
      {/* Header */}
      <Box bg="white" borderBottomWidth={1} borderColor="gray.100" px={6} py={0}>
        <HStack justifyContent="space-between" maxW="760px" mx="auto" h="64px">
          <HStack gap={3}>
            <Heading size="md" fontWeight="bold" letterSpacing="tight">
              Task Manager
            </Heading>
          </HStack>
          <HStack gap={4}>
            <Text fontSize="sm" color="gray.500" display={{ base: "none", sm: "block" }}>
              {user.email}
            </Text>
            <Button
              size="sm"
              variant="ghost"
              colorPalette="red"
              loading={loggingOut}
              onClick={handleLogout}
            >
              Sign out
            </Button>
          </HStack>
        </HStack>
      </Box>

      {/* Main */}
      <Box maxW="760px" mx="auto" px={6} py={10}>
        <Stack gap={8}>
          {/* Page title */}
          <Box>
            <HStack gap={3} align="baseline">
              <Heading size="lg" fontWeight="bold">
                My Tasks
              </Heading>
              {pending > 0 && (
                <Badge colorPalette="blue" variant="subtle" fontSize="sm" px={2} py={0.5} rounded="full">
                  {pending} pending
                </Badge>
              )}
            </HStack>
            <Text color="gray.500" fontSize="sm" mt={1}>
              {tasks.length === 0
                ? "You have no tasks yet."
                : `${tasks.length} task${tasks.length === 1 ? "" : "s"} total`}
            </Text>
          </Box>

          {/* Add Task */}
          <Box
            bg="white"
            p={6}
            rounded="2xl"
            shadow="sm"
            borderWidth={1}
            borderColor="gray.100"
          >
            <Text fontWeight="semibold" mb={4} color="gray.700">
              Add a new task
            </Text>
            <Box as="form" onSubmit={handleAddTask}>
              <HStack gap={3}>
                <Input
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  placeholder="What needs to be done?"
                  size="lg"
                  px={4}
                  maxLength={200}
                  flex={1}
                />
                <Button
                  type="submit"
                  colorPalette="blue"
                  loading={adding}
                  size="lg"
                  px={6}
                >
                  Add
                </Button>
              </HStack>
              {addError && (
                <Box bg="red.50" border="1px solid" borderColor="red.200" rounded="lg" px={4} py={2} mt={3}>
                  <Text color="red.600" fontSize="sm">{addError}</Text>
                </Box>
              )}
            </Box>
          </Box>

          {/* Task List */}
          <Box>
            {tasks.length === 0 ? (
              <Box
                bg="white"
                py={16}
                rounded="2xl"
                shadow="sm"
                borderWidth={1}
                borderColor="gray.100"
                textAlign="center"
              >
                <Text fontSize="2xl" mb={3}>✓</Text>
                <Text fontWeight="medium" color="gray.600">All clear!</Text>
                <Text color="gray.400" fontSize="sm" mt={1}>
                  Add a task above to get started.
                </Text>
              </Box>
            ) : (
              <Stack gap={2}>
                {tasks.map((task) => (
                  <Box
                    key={task.id}
                    bg="white"
                    px={5}
                    py={4}
                    rounded="xl"
                    shadow="sm"
                    borderWidth={1}
                    borderColor="gray.100"
                    borderLeftWidth={3}
                    borderLeftColor={task.completed ? "gray.200" : "blue.400"}
                    transition="all 0.15s"
                  >
                    <HStack justify="space-between">
                      <Text
                        fontSize="sm"
                        fontWeight="medium"
                        textDecoration={task.completed ? "line-through" : "none"}
                        color={task.completed ? "gray.400" : "gray.800"}
                      >
                        {task.title}
                      </Text>
                      {task.completed && (
                        <Badge colorPalette="green" variant="subtle" fontSize="xs">
                          Done
                        </Badge>
                      )}
                    </HStack>
                  </Box>
                ))}
              </Stack>
            )}
          </Box>
        </Stack>
      </Box>
    </Box>
  );
}

