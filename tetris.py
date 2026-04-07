import random
import tkinter as tk


BOARD_WIDTH = 10
BOARD_HEIGHT = 20
CELL_SIZE = 30
PREVIEW_SIZE = 4
DROP_START_MS = 700
MIN_DROP_MS = 120
LINES_PER_LEVEL = 10
POINTS = {1: 100, 2: 300, 3: 500, 4: 800}


SHAPES = {
    "I": {
        "color": "#39c5bb",
        "rotations": [
            [(0, 1), (1, 1), (2, 1), (3, 1)],
            [(2, 0), (2, 1), (2, 2), (2, 3)],
        ],
    },
    "O": {
        "color": "#f6d743",
        "rotations": [
            [(1, 0), (2, 0), (1, 1), (2, 1)],
        ],
    },
    "T": {
        "color": "#b565f5",
        "rotations": [
            [(1, 0), (0, 1), (1, 1), (2, 1)],
            [(1, 0), (1, 1), (2, 1), (1, 2)],
            [(0, 1), (1, 1), (2, 1), (1, 2)],
            [(1, 0), (0, 1), (1, 1), (1, 2)],
        ],
    },
    "S": {
        "color": "#6ad66a",
        "rotations": [
            [(1, 0), (2, 0), (0, 1), (1, 1)],
            [(1, 0), (1, 1), (2, 1), (2, 2)],
        ],
    },
    "Z": {
        "color": "#f25f5c",
        "rotations": [
            [(0, 0), (1, 0), (1, 1), (2, 1)],
            [(2, 0), (1, 1), (2, 1), (1, 2)],
        ],
    },
    "J": {
        "color": "#4d8df7",
        "rotations": [
            [(0, 0), (0, 1), (1, 1), (2, 1)],
            [(1, 0), (2, 0), (1, 1), (1, 2)],
            [(0, 1), (1, 1), (2, 1), (2, 2)],
            [(1, 0), (1, 1), (0, 2), (1, 2)],
        ],
    },
    "L": {
        "color": "#ff9f43",
        "rotations": [
            [(2, 0), (0, 1), (1, 1), (2, 1)],
            [(1, 0), (1, 1), (1, 2), (2, 2)],
            [(0, 1), (1, 1), (2, 1), (0, 2)],
            [(0, 0), (1, 0), (1, 1), (1, 2)],
        ],
    },
}


class Piece:
    def __init__(self, kind):
        self.kind = kind
        self.rotation = 0
        self.x = BOARD_WIDTH // 2 - 2
        self.y = 0

    @property
    def color(self):
        return SHAPES[self.kind]["color"]

    def blocks(self, rotation=None, dx=0, dy=0):
        rotation_index = self.rotation if rotation is None else rotation
        pattern = SHAPES[self.kind]["rotations"][rotation_index]
        return [(self.x + x + dx, self.y + y + dy) for x, y in pattern]

    def rotation_count(self):
        return len(SHAPES[self.kind]["rotations"])


class TetrisGame:
    def __init__(self, root):
        self.root = root
        self.root.title("Tetris")
        self.root.configure(bg="#11151c")
        self.root.resizable(False, False)

        self.board = [[None for _ in range(BOARD_WIDTH)] for _ in range(BOARD_HEIGHT)]
        self.bag = []
        self.current_piece = None
        self.next_piece = None
        self.score = 0
        self.lines_cleared = 0
        self.level = 1
        self.game_over = False
        self.paused = False
        self.drop_job = None

        self.build_ui()
        self.bind_keys()
        self.start_new_game()

    def build_ui(self):
        wrapper = tk.Frame(self.root, bg="#11151c", padx=16, pady=16)
        wrapper.pack()

        self.canvas = tk.Canvas(
            wrapper,
            width=BOARD_WIDTH * CELL_SIZE,
            height=BOARD_HEIGHT * CELL_SIZE,
            bg="#1b2430",
            highlightthickness=0,
        )
        self.canvas.grid(row=0, column=0, rowspan=2)

        sidebar = tk.Frame(wrapper, bg="#11151c", padx=16)
        sidebar.grid(row=0, column=1, sticky="n")

        title = tk.Label(
            sidebar,
            text="TETRIS",
            font=("Consolas", 24, "bold"),
            fg="#f5f7fa",
            bg="#11151c",
        )
        title.pack(anchor="w", pady=(0, 12))

        self.score_var = tk.StringVar()
        self.level_var = tk.StringVar()
        self.lines_var = tk.StringVar()
        self.status_var = tk.StringVar()

        for variable in (self.score_var, self.level_var, self.lines_var, self.status_var):
            label = tk.Label(
                sidebar,
                textvariable=variable,
                font=("Consolas", 14),
                fg="#d9e2ec",
                bg="#11151c",
                justify="left",
                anchor="w",
            )
            label.pack(anchor="w", pady=4)

        preview_label = tk.Label(
            sidebar,
            text="Next",
            font=("Consolas", 16, "bold"),
            fg="#f5f7fa",
            bg="#11151c",
        )
        preview_label.pack(anchor="w", pady=(16, 8))

        self.preview_canvas = tk.Canvas(
            sidebar,
            width=PREVIEW_SIZE * CELL_SIZE,
            height=PREVIEW_SIZE * CELL_SIZE,
            bg="#1b2430",
            highlightthickness=0,
        )
        self.preview_canvas.pack(anchor="w")

        controls = tk.Label(
            sidebar,
            text=(
                "Controls\n"
                "Left / Right: Move\n"
                "Up: Rotate\n"
                "Down: Soft drop\n"
                "Space: Hard drop\n"
                "P: Pause\n"
                "R: Restart"
            ),
            font=("Consolas", 11),
            fg="#9fb3c8",
            bg="#11151c",
            justify="left",
        )
        controls.pack(anchor="w", pady=(16, 0))

    def bind_keys(self):
        self.root.bind("<Left>", lambda event: self.handle_move(-1, 0))
        self.root.bind("<Right>", lambda event: self.handle_move(1, 0))
        self.root.bind("<Down>", lambda event: self.soft_drop())
        self.root.bind("<Up>", lambda event: self.rotate_piece())
        self.root.bind("<space>", lambda event: self.hard_drop())
        self.root.bind("<Key-p>", lambda event: self.toggle_pause())
        self.root.bind("<Key-P>", lambda event: self.toggle_pause())
        self.root.bind("<Key-r>", lambda event: self.start_new_game())
        self.root.bind("<Key-R>", lambda event: self.start_new_game())

    def start_new_game(self):
        if self.drop_job is not None:
            self.root.after_cancel(self.drop_job)
            self.drop_job = None

        self.board = [[None for _ in range(BOARD_WIDTH)] for _ in range(BOARD_HEIGHT)]
        self.bag = []
        self.score = 0
        self.lines_cleared = 0
        self.level = 1
        self.game_over = False
        self.paused = False
        self.current_piece = self.create_piece()
        self.next_piece = self.create_piece()
        self.update_sidebar()
        self.draw()
        self.schedule_drop()

    def create_piece(self):
        if not self.bag:
            self.bag = list(SHAPES.keys())
            random.shuffle(self.bag)
        return Piece(self.bag.pop())

    def schedule_drop(self):
        if self.game_over or self.paused:
            return
        self.drop_job = self.root.after(self.drop_speed(), self.tick)

    def drop_speed(self):
        return max(MIN_DROP_MS, DROP_START_MS - (self.level - 1) * 60)

    def tick(self):
        self.drop_job = None
        if self.game_over or self.paused:
            return

        if self.can_place(self.current_piece, dy=1):
            self.current_piece.y += 1
        else:
            self.lock_piece()

        self.draw()
        self.schedule_drop()

    def handle_move(self, dx, dy):
        if self.game_over or self.paused:
            return
        if self.can_place(self.current_piece, dx=dx, dy=dy):
            self.current_piece.x += dx
            self.current_piece.y += dy
            self.draw()

    def soft_drop(self):
        if self.game_over or self.paused:
            return
        if self.can_place(self.current_piece, dy=1):
            self.current_piece.y += 1
            self.score += 1
            self.update_sidebar()
            self.draw()
        else:
            self.lock_piece()
            self.draw()

    def hard_drop(self):
        if self.game_over or self.paused:
            return
        distance = 0
        while self.can_place(self.current_piece, dy=1):
            self.current_piece.y += 1
            distance += 1
        self.score += distance * 2
        self.lock_piece()
        self.draw()

    def rotate_piece(self):
        if self.game_over or self.paused:
            return

        next_rotation = (self.current_piece.rotation + 1) % self.current_piece.rotation_count()
        kicks = [0, -1, 1, -2, 2]
        for kick in kicks:
            if self.can_place(self.current_piece, rotation=next_rotation, dx=kick):
                self.current_piece.rotation = next_rotation
                self.current_piece.x += kick
                self.draw()
                return

    def can_place(self, piece, rotation=None, dx=0, dy=0):
        for x, y in piece.blocks(rotation=rotation, dx=dx, dy=dy):
            if x < 0 or x >= BOARD_WIDTH or y >= BOARD_HEIGHT:
                return False
            if y >= 0 and self.board[y][x] is not None:
                return False
        return True

    def lock_piece(self):
        for x, y in self.current_piece.blocks():
            if y < 0:
                self.end_game()
                return
            self.board[y][x] = self.current_piece.color

        cleared = self.clear_lines()
        if cleared:
            self.score += POINTS[cleared] * self.level
            self.lines_cleared += cleared
            self.level = self.lines_cleared // LINES_PER_LEVEL + 1

        self.current_piece = self.next_piece
        self.next_piece = self.create_piece()

        if not self.can_place(self.current_piece):
            self.end_game()

        self.update_sidebar()

    def clear_lines(self):
        remaining_rows = [row for row in self.board if any(cell is None for cell in row)]
        cleared = BOARD_HEIGHT - len(remaining_rows)
        while len(remaining_rows) < BOARD_HEIGHT:
            remaining_rows.insert(0, [None for _ in range(BOARD_WIDTH)])
        self.board = remaining_rows
        return cleared

    def end_game(self):
        self.game_over = True
        if self.drop_job is not None:
            self.root.after_cancel(self.drop_job)
            self.drop_job = None
        self.update_sidebar()

    def toggle_pause(self):
        if self.game_over:
            return
        self.paused = not self.paused
        self.update_sidebar()
        self.draw()
        if not self.paused and self.drop_job is None:
            self.schedule_drop()

    def update_sidebar(self):
        self.score_var.set(f"Score: {self.score}")
        self.level_var.set(f"Level: {self.level}")
        self.lines_var.set(f"Lines: {self.lines_cleared}")
        if self.game_over:
            self.status_var.set("Status: Game Over")
        elif self.paused:
            self.status_var.set("Status: Paused")
        else:
            self.status_var.set("Status: Playing")
        self.draw_preview()

    def draw_cell(self, canvas, x, y, color, outline="#0b1119"):
        left = x * CELL_SIZE
        top = y * CELL_SIZE
        right = left + CELL_SIZE
        bottom = top + CELL_SIZE
        canvas.create_rectangle(left, top, right, bottom, fill=color, outline=outline, width=2)

    def draw(self):
        self.canvas.delete("all")

        for y in range(BOARD_HEIGHT):
            for x in range(BOARD_WIDTH):
                self.canvas.create_rectangle(
                    x * CELL_SIZE,
                    y * CELL_SIZE,
                    (x + 1) * CELL_SIZE,
                    (y + 1) * CELL_SIZE,
                    outline="#253041",
                    width=1,
                )
                if self.board[y][x]:
                    self.draw_cell(self.canvas, x, y, self.board[y][x])

        if self.current_piece is not None:
            ghost_y = self.current_piece.y
            while self.can_place(self.current_piece, dy=ghost_y - self.current_piece.y + 1):
                ghost_y += 1

            for x, y in self.current_piece.blocks(dy=ghost_y - self.current_piece.y):
                if y >= 0:
                    self.canvas.create_rectangle(
                        x * CELL_SIZE + 4,
                        y * CELL_SIZE + 4,
                        (x + 1) * CELL_SIZE - 4,
                        (y + 1) * CELL_SIZE - 4,
                        outline="#aab7c4",
                    )

            for x, y in self.current_piece.blocks():
                if y >= 0:
                    self.draw_cell(self.canvas, x, y, self.current_piece.color)

        if self.game_over or self.paused:
            overlay_text = "Paused" if self.paused and not self.game_over else "Game Over"
            subtext = "Press R to restart" if self.game_over else "Press P to resume"
            self.canvas.create_rectangle(30, 220, 270, 370, fill="#11151c", outline="#d9e2ec", width=2)
            self.canvas.create_text(150, 270, text=overlay_text, fill="#f5f7fa", font=("Consolas", 24, "bold"))
            self.canvas.create_text(150, 320, text=subtext, fill="#d9e2ec", font=("Consolas", 12))

    def draw_preview(self):
        self.preview_canvas.delete("all")
        if self.next_piece is None:
            return

        pattern = SHAPES[self.next_piece.kind]["rotations"][0]
        min_x = min(x for x, _ in pattern)
        min_y = min(y for _, y in pattern)
        offset_x = 1 - min_x
        offset_y = 1 - min_y

        for x, y in pattern:
            left = (x + offset_x) * CELL_SIZE
            top = (y + offset_y) * CELL_SIZE
            self.preview_canvas.create_rectangle(
                left,
                top,
                left + CELL_SIZE,
                top + CELL_SIZE,
                fill=self.next_piece.color,
                outline="#0b1119",
                width=2,
            )


def main():
    root = tk.Tk()
    TetrisGame(root)
    root.mainloop()


if __name__ == "__main__":
    main()
