import React, { useState } from 'react';
import { 
  useGetTasks, 
  useCreateTask, 
  useUpdateTask, 
  useDeleteTask, 
  useGetTaskStats,
  getGetTasksQueryKey,
  getGetTaskStatsQueryKey,
  Task,
  TaskColumn,
  TaskPriority,
  TaskInputColumn,
  TaskInputPriority
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors, 
  DragStartEvent, 
  DragEndEvent, 
  defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import { 
  SortableContext, 
  arrayMove, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Plus, GripVertical, Trash2, Edit2, AlertCircle, CheckSquare, Clock, LayoutList } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';

const COLUMNS = [
  { id: 'todo', title: 'To Do', icon: LayoutList, color: 'border-muted-foreground/30 bg-muted/10' },
  { id: 'in_progress', title: 'In Progress', icon: Clock, color: 'border-primary/30 bg-primary/5' },
  { id: 'completed', title: 'Completed', icon: CheckSquare, color: 'border-chart-2/30 bg-chart-2/5' }
] as const;

const priorityColors = {
  low: 'bg-muted text-muted-foreground hover:bg-muted/80',
  medium: 'bg-amber-500/20 text-amber-500 hover:bg-amber-500/30',
  high: 'bg-destructive/20 text-destructive hover:bg-destructive/30'
};

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  column: z.enum(['todo', 'in_progress', 'completed']),
  priority: z.enum(['low', 'medium', 'high']),
  tags: z.string().optional()
});

type TaskFormData = z.infer<typeof taskSchema>;

function SortableTaskCard({ task, onEdit, onDelete }: { task: Task, onEdit: (t: Task) => void, onDelete: (t: Task) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id.toString(), data: task });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <Card 
      ref={setNodeRef} 
      style={style} 
      className={`relative group border shadow-sm ${isDragging ? 'z-50' : ''}`}
    >
      <div 
        {...attributes} 
        {...listeners} 
        className="absolute top-3 right-3 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </div>
      <CardContent className="p-4 space-y-3">
        <div className="pr-6">
          <Badge className={`mb-2 font-normal text-[10px] uppercase tracking-wider ${priorityColors[task.priority as keyof typeof priorityColors]}`} variant="outline">
            {task.priority}
          </Badge>
          <h4 className="font-semibold text-sm">{task.title}</h4>
          {task.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
          )}
        </div>
        
        {task.tags && (
          <div className="flex flex-wrap gap-1">
            {task.tags.split(',').map(tag => (
              <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-sm bg-muted/50 text-muted-foreground">
                {tag.trim()}
              </span>
            ))}
          </div>
        )}
        
        <div className="flex items-center justify-between pt-2 mt-2 border-t border-border border-dashed">
          <span className="text-[10px] text-muted-foreground">
            {format(new Date(task.createdAt), 'MMM d')}
          </span>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onEdit(task)}>
              <Edit2 className="w-3 h-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => onDelete(task)}>
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Tasks() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { data: tasks = [], isLoading: isTasksLoading } = useGetTasks({ query: { queryKey: getGetTasksQueryKey() } });
  const { data: stats, isLoading: isStatsLoading } = useGetTaskStats({ query: { queryKey: getGetTaskStatsQueryKey() } });
  
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const [activeId, setActiveId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deleteConfirmTask, setDeleteConfirmTask] = useState<Task | null>(null);

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      description: '',
      column: 'todo',
      priority: 'medium',
      tags: ''
    }
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    // Find the task
    const activeTask = tasks.find(t => t.id.toString() === activeId);
    if (!activeTask) return;

    // If dragged over a column
    if (COLUMNS.some(c => c.id === overId)) {
      const newColumn = overId as TaskColumn;
      if (activeTask.column !== newColumn) {
        optimisticUpdate(activeTask.id, { column: newColumn });
      }
      return;
    }

    // If dragged over another task
    const overTask = tasks.find(t => t.id.toString() === overId);
    if (overTask && activeTask.column !== overTask.column) {
      optimisticUpdate(activeTask.id, { column: overTask.column as TaskColumn });
    }
  };

  const optimisticUpdate = (taskId: number, updates: Partial<Task>) => {
    // Optimistic cache update
    queryClient.setQueryData(getGetTasksQueryKey(), (old: Task[] | undefined) => {
      if (!old) return old;
      return old.map(t => t.id === taskId ? { ...t, ...updates } : t);
    });

    updateTask.mutate(
      { id: taskId, data: updates as any },
      {
        onError: () => {
          // Revert on error
          queryClient.invalidateQueries({ queryKey: getGetTasksQueryKey() });
          toast({ title: 'Error', description: 'Failed to update task', variant: 'destructive' });
        },
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetTaskStatsQueryKey() });
        }
      }
    );
  };

  const openNewTaskModal = (column: TaskColumn = 'todo') => {
    setEditingTask(null);
    form.reset({
      title: '',
      description: '',
      column,
      priority: 'medium',
      tags: ''
    });
    setIsModalOpen(true);
  };

  const openEditTaskModal = (task: Task) => {
    setEditingTask(task);
    form.reset({
      title: task.title,
      description: task.description || '',
      column: task.column,
      priority: task.priority,
      tags: task.tags || ''
    });
    setIsModalOpen(true);
  };

  const onSubmit = (values: TaskFormData) => {
    if (editingTask) {
      updateTask.mutate({ id: editingTask.id, data: values as any }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetTasksQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetTaskStatsQueryKey() });
          setIsModalOpen(false);
          toast({ title: 'Task updated' });
        }
      });
    } else {
      createTask.mutate({ data: values as any }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetTasksQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetTaskStatsQueryKey() });
          setIsModalOpen(false);
          toast({ title: 'Task created' });
        }
      });
    }
  };

  const handleDeleteTask = () => {
    if (!deleteConfirmTask) return;
    deleteTask.mutate({ id: deleteConfirmTask.id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetTasksQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetTaskStatsQueryKey() });
        setDeleteConfirmTask(null);
        toast({ title: 'Task deleted' });
      }
    });
  };

  // Group tasks by column
  const tasksByColumn = {
    todo: tasks.filter(t => t.column === 'todo'),
    in_progress: tasks.filter(t => t.column === 'in_progress'),
    completed: tasks.filter(t => t.column === 'completed')
  };

  return (
    <div className="h-full flex flex-col max-w-[1600px] mx-auto pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground">Manage your work and keep track of progress.</p>
        </div>
        <Button onClick={() => openNewTaskModal('todo')} className="gap-2 shrink-0">
          <Plus className="w-4 h-4" /> Add Task
        </Button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 shrink-0">
        {isStatsLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)
        ) : stats ? (
          <>
            <Card className="bg-card">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <LayoutList className="w-8 h-8 text-muted-foreground/30" />
              </CardContent>
            </Card>
            <Card className="bg-card border-muted-foreground/20">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">To Do</p>
                  <p className="text-2xl font-bold">{stats.todo}</p>
                </div>
                <div className="w-3 h-3 rounded-full bg-muted-foreground/50" />
              </CardContent>
            </Card>
            <Card className="bg-card border-primary/20">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                  <p className="text-2xl font-bold text-primary">{stats.inProgress}</p>
                </div>
                <div className="w-3 h-3 rounded-full bg-primary/50" />
              </CardContent>
            </Card>
            <Card className="bg-card border-chart-2/20">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold text-chart-2">{stats.completed}</p>
                </div>
                <div className="w-3 h-3 rounded-full bg-chart-2/50" />
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto min-h-[500px]">
        <div className="flex gap-6 h-full min-w-max pb-4">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            {COLUMNS.map((col) => (
              <div key={col.id} className={`flex flex-col w-[350px] shrink-0 rounded-xl border ${col.color}`}>
                <div className="p-4 flex items-center justify-between border-b border-border/50 shrink-0">
                  <h3 className="font-semibold flex items-center gap-2">
                    <col.icon className="w-4 h-4 opacity-70" />
                    {col.title}
                    <Badge variant="secondary" className="ml-2 font-normal">
                      {tasksByColumn[col.id as keyof typeof tasksByColumn]?.length || 0}
                    </Badge>
                  </h3>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openNewTaskModal(col.id as TaskColumn)}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="flex-1 p-3 overflow-y-auto">
                  <SortableContext
                    id={col.id}
                    items={tasksByColumn[col.id as keyof typeof tasksByColumn].map(t => t.id.toString())}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-3 min-h-[150px]">
                      {isTasksLoading ? (
                        Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)
                      ) : (
                        tasksByColumn[col.id as keyof typeof tasksByColumn].map(task => (
                          <SortableTaskCard 
                            key={task.id} 
                            task={task} 
                            onEdit={openEditTaskModal}
                            onDelete={setDeleteConfirmTask}
                          />
                        ))
                      )}
                      {!isTasksLoading && tasksByColumn[col.id as keyof typeof tasksByColumn].length === 0 && (
                        <div className="h-24 border-2 border-dashed border-border/50 rounded-lg flex items-center justify-center text-sm text-muted-foreground bg-background/50">
                          Drop tasks here
                        </div>
                      )}
                    </div>
                  </SortableContext>
                </div>
              </div>
            ))}

            <DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: "0.5" } } }) }}>
              {activeId ? (
                <div className="opacity-80 rotate-2">
                  <SortableTaskCard 
                    task={tasks.find(t => t.id.toString() === activeId)!} 
                    onEdit={() => {}} 
                    onDelete={() => {}} 
                  />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      </div>

      {/* Task Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingTask ? 'Edit Task' : 'Create Task'}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="What needs to be done?" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Add details..." className="resize-none" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="column"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="todo">To Do</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags (Comma separated)</FormLabel>
                    <FormControl>
                      <Input placeholder="frontend, bug, ui..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createTask.isPending || updateTask.isPending}>
                  {createTask.isPending || updateTask.isPending ? 'Saving...' : 'Save Task'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirmTask} onOpenChange={(open) => !open && setDeleteConfirmTask(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              Delete Task
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to delete <strong>{deleteConfirmTask?.title}</strong>?</p>
            <p className="text-sm text-muted-foreground mt-2">This action cannot be undone.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmTask(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteTask} disabled={deleteTask.isPending}>
              {deleteTask.isPending ? 'Deleting...' : 'Delete Task'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
