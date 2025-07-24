import * as React from "react"
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  IconCircleCheckFilled,
  IconDotsVertical,
  IconGripVertical,
  IconLoader,
  IconPlayerPlay,
} from "@tabler/icons-react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  Row,
  useReactTable,
} from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { invoke } from "@tauri-apps/api/core";
import { useState } from "react";

export const schema = {
  id: "",
  header: "",
  type: "",
  status: "",
  round_trip_ms: null,
  wav_path: null,
  target: "",
  timestamp: "",
  text: "",
}

function DragHandle({ id }: { id: string }) {
  const { attributes, listeners } = useSortable({
    id,
  })
  return (
    <Button
      {...attributes}
      {...listeners}
      variant="ghost"
      size="icon"
      className="text-muted-foreground size-7 hover:bg-transparent"
    >
      <IconGripVertical className="text-muted-foreground size-3" />
      <span className="sr-only">Drag to reorder</span>
    </Button>
  )
}

const columns: ColumnDef<any>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "header",
    header: "Header",
    cell: ({ row }) => <TableCellViewer item={row.original} />, // custom side panel
    enableHiding: false,
  },
  {
    accessorKey: "type",
    header: "Source",
    cell: ({ row }) => (
      <Badge variant="outline" className="text-muted-foreground px-1.5">
        {row.original.type}
      </Badge>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge
        variant="outline"
        className={
          row.original.status === "success"
            ? "bg-green-100 text-green-700 border-green-300 dark:bg-green-900 dark:text-green-300 dark:border-green-700 px-1.5"
            : "text-muted-foreground px-1.5"
        }
      >
        {row.original.status === "success" ? (
          <IconCircleCheckFilled className="fill-green-500 dark:fill-green-400 inline-block mr-1" />
        ) : (
          <IconLoader />
        )}
        {row.original.status}
      </Badge>
    ),
  },
  {
    accessorKey: "round_trip_ms",
    header: "Groq RT (ms)",
    cell: ({ row }) => row.original.round_trip_ms ? row.original.round_trip_ms : "-",
  },
  {
    accessorKey: "wav_path",
    header: "Audio Directory",
    cell: ({ row }) => <AudioCell wavPath={row.original.wav_path} />,
  },
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.original.id}</span>,
  },
  {
    accessorKey: "date",
    header: "Date/Time",
    cell: ({ row }) => row.original.date || "-",
  },
]

function DraggableRow({ row }: { row: Row<any> }) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: row.original.id,
  })
  return (
    <TableRow
      data-state={row.getIsSelected() && "selected"}
      data-dragging={isDragging}
      ref={setNodeRef}
      className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition,
      }}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  )
}

export function DataTable({ data: initialData }: { data: any[] }) {
  const [data, setData] = React.useState(() => initialData)
  const [rowSelection, setRowSelection] = useState({})
  const [page, setPage] = useState(0)
  const pageSize = 10
  const pageCount = Math.ceil(data.length / pageSize)
  const pagedData = data.slice(page * pageSize, (page + 1) * pageSize)
  const table = useReactTable({
    data: pagedData,
    columns,
    state: {
      rowSelection,
    },
    getRowId: (row) => row.id.toString(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
  })
  return (
    <div className="w-full flex-col justify-start gap-6">
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader className="bg-muted sticky top-0 z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} colSpan={header.colSpan}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody className="**:data-[slot=table-cell]:first:w-8">
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between px-4 py-2">
        <div className="text-muted-foreground text-sm">
          Page {page + 1} of {pageCount}
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setPage(0)} disabled={page === 0}>
            First
          </Button>
          <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
            Previous
          </Button>
          <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))} disabled={page >= pageCount - 1}>
            Next
          </Button>
          <Button size="sm" variant="outline" onClick={() => setPage(pageCount - 1)} disabled={page >= pageCount - 1}>
            Last
          </Button>
        </div>
      </div>
    </div>
  )
}

function AudioCell({ wavPath }: { wavPath: string | null }) {
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  if (!wavPath) return "-";
  const handlePlay = async () => {
    setLoading(true);
    const src = await invoke<string>("get_audio_base64", { path: wavPath });
    setAudioSrc(src);
    setLoading(false);
  };
  return (
    <div className="flex items-center gap-2">
      <span className="truncate max-w-[120px]" title={wavPath}>{wavPath.replace(/\\/g, "/")}</span>
      <Button size="icon" variant="ghost" onClick={handlePlay} disabled={loading}>
        <IconPlayerPlay className="w-4 h-4" />
      </Button>
      {audioSrc && <audio controls src={audioSrc} autoPlay style={{ height: 24 }} />}
    </div>
  );
}

function TableCellViewer({ item }: { item: any }) {
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const handlePlay = async () => {
    setLoading(true);
    const src = await invoke<string>("get_audio_base64", { path: item.wav_path });
    setAudioSrc(src);
    setLoading(false);
  };
  return (
    <Drawer direction="right" disableDrag>
      <DrawerTrigger asChild>
        <Button variant="link" className="text-foreground w-fit px-0 text-left">
          {item.header}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="gap-1">
          <DrawerTitle>{item.header}</DrawerTitle>
          <DrawerDescription>
            <div className="flex flex-col gap-2 mt-2" style={{ userSelect: 'text' }}>
              <div><b>ID:</b> <span className="text-xs text-muted-foreground">{item.id}</span></div>
              <div><b>Status:</b> <span className={item.status === "success" ? "text-green-600" : "text-red-600"}>{item.status}</span></div>
              <div><b>Groq RT (ms):</b> {item.round_trip_ms ?? '-'}</div>
              <div><b>Source:</b> {item.type}</div>
              <div><b>Timestamp:</b> {item.timestamp}</div>
              <div><b>Audio Directory:</b> {item.wav_path ? <span className="break-all">{item.wav_path.replace(/\\/g, "/")}</span> : '-'}</div>
              {item.wav_path && (
                <div className="flex items-center gap-2 mt-2">
                  <Button size="icon" variant="ghost" onClick={handlePlay} disabled={loading}>
                    <IconPlayerPlay className="w-4 h-4" />
                  </Button>
                  {audioSrc && <audio controls src={audioSrc} autoPlay style={{ width: '100%' }} />}
                </div>
              )}
            </div>
            <div className="mt-4" style={{ userSelect: 'text' }}>
              <b>Full Transcript:</b>
              <div className="bg-muted rounded p-2 mt-1 whitespace-pre-wrap text-sm max-h-48 overflow-y-auto" style={{ userSelect: 'text' }}>
                {item.text}
              </div>
            </div>
          </DrawerDescription>
        </DrawerHeader>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="outline">Done</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
