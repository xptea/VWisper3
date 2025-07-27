import * as React from "react"
import {
  IconCircleCheckFilled,
  IconLoader,
  IconPlayerPlay,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
} from "@tabler/icons-react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { invoke } from "@tauri-apps/api/core";
import { useState, useMemo, useCallback } from "react";

export const schema = {
  id: "",
  header: "",
  type: "",
  status: "",
  round_trip_ms: null,
  hold_time_ms: null,
  wav_path: null,
  target: "",
  timestamp: "",
  text: "",
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
    cell: ({ row }) => <TableCellViewer item={row.original} />,
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
    accessorKey: "hold_time_ms",
      header: "Hold Time (s)",
      cell: ({ row }) =>
        row.original.hold_time_ms != null
          ? (row.original.hold_time_ms / 1000).toFixed(2)
          : "-",
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

export function DataTable({ data: initialData }: { data: any[] }) {
  const [data] = React.useState(() => initialData)
  const [rowSelection, setRowSelection] = useState({})
  const [page, setPage] = useState(0)
  const [pageInput, setPageInput] = useState("")
  const pageSize = 10
  
  // Memoize expensive calculations
  const { pageCount, pagedData, startIndex, endIndex } = useMemo(() => {
    const pageCount = Math.ceil(data.length / pageSize)
    const startIndex = page * pageSize
    const endIndex = Math.min((page + 1) * pageSize, data.length)
    const pagedData = data.slice(startIndex, endIndex)
    
    return { pageCount, pagedData, startIndex, endIndex }
  }, [data, page, pageSize])
  
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

  const handlePageChange = useCallback((newPage: number) => {
    if (newPage >= 0 && newPage < pageCount) {
      setPage(newPage)
      setPageInput("")
    }
  }, [pageCount])

  const handlePageInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setPageInput(value)
  }, [])

  const handlePageInputKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const newPage = parseInt(pageInput) - 1
      handlePageChange(newPage)
    }
  }, [pageInput, handlePageChange])

  const handlePageInputBlur = useCallback(() => {
    const newPage = parseInt(pageInput) - 1
    if (!isNaN(newPage) && newPage >= 0 && newPage < pageCount) {
      setPage(newPage)
    }
    setPageInput("")
  }, [pageInput, pageCount])

  // Reset to first page if data changes and current page is invalid
  React.useEffect(() => {
    if (page >= pageCount && pageCount > 0) {
      setPage(0)
    }
  }, [page, pageCount])

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
      
      <div className="flex items-center justify-between px-2">
        <div className="flex-1 text-sm text-muted-foreground">
          {data.length > 0 && (
            <>
              Showing {startIndex + 1} to {endIndex} of {data.length} results
            </>
          )}
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Page</p>
            <Input
              type="number"
              min={1}
              max={pageCount}
              value={pageInput}
              onChange={handlePageInputChange}
              onKeyDown={handlePageInputKeyDown}
              onBlur={handlePageInputBlur}
              className="w-16 h-8 text-center"
              placeholder={String(page + 1)}
            />
            <p className="text-sm text-muted-foreground">
              of {pageCount}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => handlePageChange(0)}
              disabled={page === 0}
            >
              <span className="sr-only">Go to first page</span>
              <IconChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 0}
            >
              <span className="sr-only">Go to previous page</span>
              <IconChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= pageCount - 1}
            >
              <span className="sr-only">Go to next page</span>
              <IconChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => handlePageChange(pageCount - 1)}
              disabled={page >= pageCount - 1}
            >
              <span className="sr-only">Go to last page</span>
              <IconChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

const AudioCell = React.memo(({ wavPath }: { wavPath: string | null }) => {
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  if (!wavPath) return <span>-</span>;
  
  const handlePlay = useCallback(async () => {
    try {
      setLoading(true);
      const src = await invoke<string>("get_audio_base64", { path: wavPath });
      setAudioSrc(src);
    } catch (error) {
      console.error("Failed to load audio:", error);
    } finally {
      setLoading(false);
    }
  }, [wavPath]);

  return (
    <div className="flex items-center gap-2">
      <span className="truncate max-w-[120px]" title={wavPath}>{wavPath.replace(/\\/g, "/")}</span>
      <Button size="icon" variant="ghost" onClick={handlePlay} disabled={loading}>
        <IconPlayerPlay className="w-4 h-4" />
      </Button>
      {audioSrc && <audio controls src={audioSrc} autoPlay style={{ height: 24 }} />}
    </div>
  );
});

AudioCell.displayName = "AudioCell";

const TableCellViewer = React.memo(({ item }: { item: any }) => {
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const handlePlay = useCallback(async () => {
    if (!item.wav_path) return;
    
    try {
      setLoading(true);
      const src = await invoke<string>("get_audio_base64", { path: item.wav_path });
      setAudioSrc(src);
    } catch (error) {
      console.error("Failed to load audio:", error);
    } finally {
      setLoading(false);
    }
  }, [item.wav_path]);

  return (
    <Drawer direction="right">
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
              <div><b>Hold Time (ms):</b> {item.hold_time_ms ?? '-'}</div>
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
            <div className="mt-4">
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
});

TableCellViewer.displayName = "TableCellViewer";
