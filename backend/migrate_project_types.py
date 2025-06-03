#!/usr/bin/env python3
"""
Migration script to add project_type field to existing projects
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, text
from core.config import settings

def migrate_project_types():
    """Add project_type column to existing projects"""
    try:
        # Create engine
        engine = create_engine(settings.DATABASE_URL)
        
        with engine.connect() as conn:
            # Check if column exists (SQLite specific)
            result = conn.execute(text("PRAGMA table_info(projects)"))
            columns = [row[1] for row in result.fetchall()]
            
            if 'project_type' not in columns:
                print("Adding project_type column to projects table...")
                # Add the column
                conn.execute(text("""
                    ALTER TABLE projects 
                    ADD COLUMN project_type VARCHAR(50) DEFAULT 'Object Detection'
                """))
                conn.commit()
                print("Column added successfully!")
            else:
                print("project_type column already exists")
            
            # Update existing projects to have default project type
            result = conn.execute(text("""
                UPDATE projects 
                SET project_type = 'Object Detection' 
                WHERE project_type IS NULL OR project_type = ''
            """))
            conn.commit()
            
            updated_rows = result.rowcount
            print(f"Updated {updated_rows} projects with default project type")
            
    except Exception as e:
        print(f"Migration failed: {e}")
        return False
    
    return True

if __name__ == "__main__":
    print("Starting project_type migration...")
    success = migrate_project_types()
    if success:
        print("Migration completed successfully!")
    else:
        print("Migration failed!")
        sys.exit(1)