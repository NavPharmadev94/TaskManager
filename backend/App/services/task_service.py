from sqlalchemy.orm import Session

from models import Task
from schemas import TaskUpdate


def create_task(db: Session, title: str, user_id: int) -> Task:
    task = Task(title=title, user_id=user_id)
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


def get_tasks(db: Session, user_id: int) -> list[Task]:
    return db.query(Task).filter(Task.user_id == user_id).all()


def get_task(db: Session, task_id: int, user_id: int) -> Task | None:
    return db.query(Task).filter(Task.id == task_id, Task.user_id == user_id).first()


def update_task(db: Session, task_id: int, task_update: TaskUpdate, user_id: int) -> Task | None:
    task = get_task(db, task_id, user_id)
    if task is None:
        return None
    if task_update.title is not None:
        task.title = task_update.title
    if task_update.completed is not None:
        task.completed = task_update.completed
    db.commit()
    db.refresh(task)
    return task


def delete_task(db: Session, task_id: int, user_id: int) -> bool:
    task = get_task(db, task_id, user_id)
    if task is None:
        return False
    db.delete(task)
    db.commit()
    return True
