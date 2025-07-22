"""Change user IDs from Integer to String

Revision ID: b79e07fb54c9
Revises: 
Create Date: 2025-07-22 13:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'b79e07fb54c9'
down_revision = None
branch_labels = None
depends_on = None

# A list of tables and their foreign key constraint names
# These names are standard for SQLAlchemy but might differ if you have a custom naming convention.
TABLES_CONSTRAINTS = [
    ('learned_user_profiles', 'learned_user_profiles_user_id_fkey'),
    ('user_interactions', 'user_interactions_user_id_fkey'),
    ('user_trips', 'user_trips_user_id_fkey'),
]

def upgrade() -> None:
    # --- Step 1: Drop existing foreign key constraints ---
    print("Dropping foreign key constraints...")
    for table, constraint_name in TABLES_CONSTRAINTS:
        try:
            op.drop_constraint(constraint_name, table, type_='foreignkey')
        except Exception as e:
            print(f"Could not drop constraint {constraint_name} from {table} (it may not exist): {e}")

    # --- Step 2: Alter the primary key column type ---
    print("Altering user_accounts.id column...")
    op.alter_column('user_accounts', 'id',
               existing_type=sa.INTEGER(),
               type_=sa.String(length=20),
               existing_nullable=False,
               # This 'USING' clause tells PostgreSQL how to convert the old integer data to the new string type.
               postgresql_using='id::character varying(20)')

    # --- Step 3: Alter the foreign key column types ---
    print("Altering user_id foreign key columns...")
    op.alter_column('learned_user_profiles', 'user_id',
               existing_type=sa.INTEGER(),
               type_=sa.String(length=20),
               postgresql_using='user_id::character varying(20)')
    op.alter_column('user_interactions', 'user_id',
               existing_type=sa.INTEGER(),
               type_=sa.String(length=20),
               postgresql_using='user_id::character varying(20)')
    op.alter_column('user_trips', 'user_id',
               existing_type=sa.INTEGER(),
               type_=sa.String(length=20),
               postgresql_using='user_id::character varying(20)')
               
    # --- Step 4: Recreate the foreign key constraints ---
    print("Recreating foreign key constraints...")
    for table, constraint_name in TABLES_CONSTRAINTS:
        op.create_foreign_key(constraint_name, table, 'user_accounts', ['user_id'], ['id'])


def downgrade() -> None:
    # --- This is the reverse process to undo the changes if needed ---
    
    # Step 1: Drop the new foreign key constraints
    for table, constraint_name in TABLES_CONSTRAINTS:
        op.drop_constraint(constraint_name, table, type_='foreignkey')

    # Step 2: Alter the foreign key columns back to Integer
    # NOTE: This will fail if you have created new users with the 'cit_' prefix.
    op.alter_column('user_trips', 'user_id',
               existing_type=sa.String(length=20),
               type_=sa.INTEGER(),
               postgresql_using='user_id::integer')
    op.alter_column('user_interactions', 'user_id',
               existing_type=sa.String(length=20),
               type_=sa.INTEGER(),
               postgresql_using='user_id::integer')
    op.alter_column('learned_user_profiles', 'user_id',
               existing_type=sa.String(length=20),
               type_=sa.INTEGER(),
               postgresql_using='user_id::integer')

    # Step 3: Alter the primary key column back to Integer
    op.alter_column('user_accounts', 'id',
               existing_type=sa.String(length=20),
               type_=sa.INTEGER(),
               postgresql_using='id::integer')

    # Step 4: Recreate the old foreign key constraints
    for table, constraint_name in TABLES_CONSTRAINTS:
        op.create_foreign_key(constraint_name, table, 'user_accounts', ['user_id'], ['id'])