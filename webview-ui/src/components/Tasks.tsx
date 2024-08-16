import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "./ui/card";
import { ExtensionRPC } from "../extensionRPC";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ArrowUp, Trash2 } from "lucide-react";
import { MouseEvent, KeyboardEvent } from "react";
import "diff2html/bundles/css/diff2html.min.css";
import { Link, useNavigate } from "react-router-dom";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Task, AssistantType } from "../types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

export function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [messageText, setMessageText] = useState("");
  const navigate = useNavigate();
  const [extensionRPC] = useState(() => new ExtensionRPC());
  const [message, setMessage] = useState("");

  const fetchTasks = useCallback(async () => {
    const fetchedTasks = (await extensionRPC.run("listTasks")) as Task[];
    console.log(`[Tasks] fetched ${fetchedTasks.length} tasks`);
    setTasks(fetchedTasks.reverse());
  }, [extensionRPC]);

  const deleteTask = useCallback(
    async (taskId: string, e: MouseEvent) => {
      e.preventDefault(); // Prevent link navigation
      e.stopPropagation(); // Prevent event bubbling
      try {
        await extensionRPC.run("deleteTask", { taskId });
        await fetchTasks();
        console.log("Task deleted successfully");
      } catch (error) {
        console.error("Failed to delete task:", error);
      }
    },
    [fetchTasks, extensionRPC]
  );

  const createNewTask = async (taskName: string) => {
    console.log(`[Tasks] creating new task ${taskName}`);
    const newTask = (await extensionRPC.run("createNewTask", {
      name: taskName.trim(),
    })) as Task;
    console.log(`[Tasks] created new task ${newTask.id}`);
    navigate(`/task/${newTask.id}`);
  };

  function handleSendMessage(assistantType: AssistantType, text: string) {
    extensionRPC.run("chatMessage", { assistantType, text });
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!message.trim()) return; // Don't submit empty messages

    createTask(message);
    sendMessage(message, assistantType);
    setMessage(""); // Clear the input
  };

  useEffect(() => {
    fetchTasks();

    window.addEventListener("message", extensionRPC.handleMessage);

    return () => {
      window.removeEventListener("message", extensionRPC.handleMessage);
    };
  }, [fetchTasks, extensionRPC]);

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <div className="mt-4 relative">
          <Textarea
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-grow p-3 pr-12"
            autoFocus
            required
            rows={4}
          />

          {messageText.trim() !== "" && (
            <div
              className={`absolute right-2 top-2 transition-opacity duration-300 ${
                messageText.trim() !== "" ? "opacity-100" : "opacity-0"
              }`}
            >
              <button
                className="bg-black p-2 rounded-lg text-white"
                name="ask"
                type="submit"
              >
                <ArrowUp className="h-3 w-3" />
              </button>
            </div>
          )}

          <div className="absolute left-2 bottom-2">
            <Select name="assistantType" defaultValue="coder">
              <SelectTrigger>
                <SelectValue placeholder="Select an assistant" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="coder">Coder</SelectItem>
                <SelectItem value="architect">Architect</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </form>

      <div className="grid md:grid-cols-2 grid-cols-1 gap-6 mt-4">
        {tasks.length === 0 && <p>No tasks</p>}
        {tasks.map((task) => (
          <div key={task.id} className="mr-4 relative">
            <Link to={`/task/${task.id}`}>
              <Card>
                <CardHeader>
                  <CardTitle>{task.name}</CardTitle>
                  <CardDescription>{task.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>{task.description}</p>
                  <p>{task.branch}</p>
                </CardContent>
              </Card>
            </Link>
            <Button
              variant="outline"
              size="sm"
              className="absolute top-2 right-2 p-1"
              onClick={(e) => deleteTask(task.id, e)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
