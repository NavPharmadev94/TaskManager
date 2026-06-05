"use client";

import { Box, Button, Heading, HStack, Input, Stack, Text } from "@chakra-ui/react";
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

  return (
    <Box minH="100vh" bg="gray.50">
      {/* Header */}
      <Box bg="white" borderBottomWidth={1} borderColor="gray.200" px={6} py={4}>
        <HStack justifyContent="space-between" maxW="700px" mx="auto">
          <Heading size="md">Task Manager</Heading>
          <HStack gap={3}>
            <Text fontSize="sm" color="gray.500">
              {user.email}
            </Text>
            <Button
              size="sm"
              variant="outline"
              colorPalette="red"
              loading={loggingOut}
              onClick={handleLogout}
            >
              Logout
            </Button>
          </HStack>
        </HStack>
      </Box>

      {/* Main */}
      <Box maxW="700px" mx="auto" px={6} py={10}>
        <Stack gap={8}>
          {/* Add Task */}
          <Box bg="white" p={6} rounded="xl" shadow="sm" borderWidth={1} borderColor="gray.100">
            <Text fontWeight="semibold" mb={4}>
              Add a task
            </Text>
            <Box as="form" onSubmit={handleAddTask}>
              <HStack gap={3}>
                <Input
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  placeholder="What needs to be done?"
                  flex={1}
                />
                <Button type="submit" colorPalette="blue" loading={adding}>
                  Add
                </Button>
              </HStack>
              {addError && (
                <Text color="red.500" fontSize="sm" mt={2}>
                  {addError}
                </Text>
              )}
            </Box>
          </Box>

          {/* Task List */}
          <Box>
            <Text fontWeight="semibold" mb={3}>
              Your tasks ({tasks.length})
            </Text>
            {tasks.length === 0 ? (
              <Box
                bg="white"
                p={6}
                rounded="xl"
                shadow="sm"
                borderWidth={1}
                borderColor="gray.100"
                textAlign="center"
              >
                <Text color="gray.400">No tasks yet. Add one above!</Text>
              </Box>
            ) : (
              <Stack gap={2}>
                {tasks.map((task) => (
                  <Box
                    key={task.id}
                    bg="white"
                    px={5}
                    py={4}
                    rounded="lg"
                    shadow="sm"
                    borderWidth={1}
                    borderColor="gray.100"
                  >
                    <Text
                      fontSize="sm"
                      textDecoration={task.completed ? "line-through" : "none"}
                      color={task.completed ? "gray.400" : "gray.800"}
                    >
                      {task.title}
                    </Text>
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
